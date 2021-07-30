import { PassThrough } from 'stream';
import { S3 } from 'aws-sdk';
import * as bodyParser from 'body-parser';
import { MD5 } from 'crypto-js';
import { NextFunction, Request, Response, Router } from 'express';
import * as sendRequest from 'request-promise-native';
import { UserClient as UserClientType } from 'common';
import { authMiddleware, OidcUser } from '../auth-router';
import { getConfig } from '../config-helper';
import Awards from './model/awards';
import CustomGoal from './model/custom-goal';
import getGoals from './model/goals';
import UserClient from './model/user-client';
import { AWS } from './aws';
import { sync } from './basket';
import Bucket from './bucket';
import Clip from './clip';
import Model from './model';
import { ClientParameterError } from './utility';
import Challenge from './challenge';
import { OpenidRequest } from 'express-openid-connect';

const Transcoder = require('stream-transcoder');

const PromiseRouter = require('express-promise-router');
export default class API {
  model: Model;
  clip: Clip;
  challenge: Challenge;
  private readonly s3: S3;
  private bucket: Bucket;

  constructor(model: Model) {
    this.model = model;
    this.clip = new Clip(this.model);
    this.challenge = new Challenge(this.model);
    this.s3 = AWS.getS3();
    this.bucket = new Bucket(this.model, this.s3);
  }

  getRouter(): Router {
    const router = PromiseRouter();

    router.use(bodyParser.json());
    router.use((request: Request, response: Response, next: NextFunction) => next(), authMiddleware);
    router.use((request: Request, response: Response, next: NextFunction) => next());
    router.get('/user_clients', this.getUserClients);
    router.post('/user_clients/:client_id/claim', this.claimUserClient);
    router.get('/user_client', this.getAccount);
    router.patch('/user_client', this.saveAccount);
    router.patch('/unregistered_dialect', this.saveDialectUnregisteredUser);
    router.delete('/user_client', this.deleteAccount);
    router.get('/getDashboardStats', this.getDashboardStats);
    router.get('/getCantonStats', this.getCantonStats);
    router.post('/user_client/avatar/:type', bodyParser.raw({ type: 'image/*' }), this.saveAvatar);
    router.post('/user_client/avatar_clip', this.saveAvatarClip);
    router.get('/user_client/avatar_clip', this.getAvatarClip);
    router.get('/user_client/delete_avatar_clip', this.deleteAvatarClip);
    //TODO :locale are ignore and could be removed in the future
    router.post('/user_client/:locale/goals', this.createCustomGoal);
    router.get('/user_client/goals', this.getGoals);
    router.get('/user_client/:locale/goals', this.getGoals);
    router.post('/user_client/awards/seen', this.seenAwards);

    router.get('/:locale/sentences', this.getRandomSentences);
    router.post('/skipped_sentences/:id', this.createSkippedSentence);

    router.use(
      '/:locale?/clips',
      (request: Request, response: Response, next: NextFunction) => {
        next();
      },
      this.clip.getRouter()
    );

    router.get('/contribution_activity', this.getContributionActivity);
    router.get('/:locale/contribution_activity', this.getContributionActivity);

    router.get('/requested_languages', this.getRequestedLanguages);
    router.post('/requested_languages', this.createLanguageRequest);

    router.post('/newsletter/', this.subscribeToNewsletter);

    router.post('/reports', this.createReport);

    router.use('/challenge', this.challenge.getRouter());
    router.get('/bucket/:bucket_type/:path/:cdn', this.getPublicUrl);

    router.post('/seen-modal/:modal_type', bodyParser.json(), this.markModalAsSeen);
    router.get('/modal-settings', bodyParser.json(), this.fetchModalSettings);

    router.use('*', (request: Request, response: Response) => {
      response.sendStatus(404);
    });

    return router;
  }

  /**
   * @see Model.findEligibleSentences
   */
  getRandomSentences = async (request: Request, response: Response) => {
    const sentences = await this.model.findEligibleSentences(
      request.client_id,
      parseInt(request.query.count as string, 10) || 1
    );
    response.json(sentences);
  };

  getRequestedLanguages = async (request: Request, response: Response) => {
    response.json(await this.model.db.getRequestedLanguages());
  };

  createLanguageRequest = async (request: Request, response: Response) => {
    await this.model.db.createLanguageRequest(request.body.language, request.client_id);
    response.json({});
  };

  getDashboardStats = async (request: Request, response: Response) => {
    response.json(await this.model.db.getDashboardStats(request.client_id));
  };

  getCantonStats = async (request: Request, response: Response) => {
    const statsPerCanton = await this.model.db.getCantonStats();
    const cantonAvgAcceptanceRatio = await this.model.db.getCantonAvgAcceptanceRatio();
    const cantonSpeakerFactor = await this.model.db.getCantonSpeakerFactor();

    var result = [];
    for (var i = 0; i < statsPerCanton.length; i++) {
      result.push({
        canton: statsPerCanton[i].canton,
        name: statsPerCanton[i].name,
        flag: statsPerCanton[i].flag,
        count: statsPerCanton[i].count,
        acceptance_ratio: cantonAvgAcceptanceRatio[i].acceptance_ratio,
        swissGermanSpeakersFactor: cantonSpeakerFactor[i].swissGermanSpeakersFactor,
        result: Math.round(
          statsPerCanton[i].count *
            cantonAvgAcceptanceRatio[i].acceptance_ratio *
            cantonSpeakerFactor[i].swissGermanSpeakersFactor
        ),
      });
    }

    result.sort((l, r): number => {
      if (l.result < r.result) return 1;
      if (l.result > r.result) return -1;
      return 0;
    });

    response.json({ result });
  };

  createSkippedSentence = async (request: Request, response: Response) => {
    const {
      client_id,
      params: { id },
    } = request;
    await this.model.db.createSkippedSentence(id, client_id);
    response.json({});
  };

  getUserClients = async (request: OpenidRequest, response: Response) => {
    if (!request.oidc.isAuthenticated()) {
      response.json([]);
      return;
    }
    const user = request.oidc.user as OidcUser;
    const email = user.email;
    const enrollment = user.enrollment;
    const userClients: UserClientType[] = [
      { email, enrollment },
      ...(await UserClient.findAllWithLocales({ email, client_id: request.client_id })),
    ];
    response.json(userClients);
  };

  saveAccount = async (request: OpenidRequest, response: Response) => {
    const { body } = request;
    if (!request.oidc.isAuthenticated()) {
      throw new ClientParameterError();
    }
    const user = request.oidc.user as OidcUser;
    response.json(await UserClient.saveAccount(user.email, body));
  };

  saveDialectUnregisteredUser = async (request: Request, response: Response) => {
    const { body } = request;
    await this.model.db.updateDialectUnregisteredUser(body.client_id, body.auth_token, body.zipcode, body.canton);
  };

  deleteAccount = async (request: OpenidRequest, response: Response) => {
    const { body } = request;
    if (!request.oidc.isAuthenticated()) {
      throw new ClientParameterError();
    }
    const user = request.oidc.user as OidcUser;
    await UserClient.deleteAccount(user.email, user.sub, body);
    response.clearCookie('connect.sid');
    response.json({});
  };

  getAccount = async (request: OpenidRequest, response: Response) => {
    let userData = null;
    if (request.oidc.isAuthenticated()) {
      const user = request.oidc.user as OidcUser;
      userData = await UserClient.findAccount(user.email);
      if (userData?.avatar_clip_url) {
        //TODO do we actually use this clip url anymore?
        userData.avatar_clip_url = await this.bucket.getAvatarClipsUrl(userData.avatar_clip_url);
      }
    }
    response.json(userData);
  };

  subscribeToNewsletter = async (request: Request, response: Response) => {
    const { body } = request;
    await this.model.db.insertNewsletterEmailForUnregisteredUser(body.client_id, body.auth_token, body.email);
  };

  saveAvatar = async (request: OpenidRequest, response: Response) => {
    let avatarURL;
    let error;
    const user = request.oidc.user as OidcUser;
    switch (request.params.type) {
      case 'default':
        avatarURL = null;
        break;
      case 'gravatar':
        try {
          avatarURL = 'https://gravatar.com/avatar/' + MD5(user.email).toString() + '.png';
          await sendRequest(avatarURL + '&d=404');
        } catch (e) {
          if (e.name != 'StatusCodeError') {
            throw e;
          }
          error = 'not_found';
        }
        break;

      case 'file':
        avatarURL = 'data:' + request.headers['content-type'] + ';base64,' + request.body.toString('base64');
        const bufferSize = Buffer.byteLength(request.body);
        if (bufferSize > 1000 * 1000) {
          error = 'too_large';
        }
        break;
      default:
        response.sendStatus(404);
        return;
    }
    if (!error) {
      await UserClient.updateAvatarURL(user.email, avatarURL);
    }
    response.json(error ? { error } : {});
  };

  // TODO: Check for empty or silent clips before uploading.
  saveAvatarClip = async (request: OpenidRequest, response: Response) => {
    const { client_id, headers } = request;
    console.log(`VOICE_AVATAR: saveAvatarClip() called, ${client_id}`);
    const clipFileName = client_id + '.mp3';
    try {
      // If upload was base64, make sure we decode it first.
      let transcoder;
      if ((headers['content-type'] as string).includes('base64')) {
        // If we were given base64, we'll need to concat it all first
        // So we can decode it in the next step.
        console.log(`VOICE_AVATAR: base64 to saveAvatarClip(), ${clipFileName}`);
        const chunks: Buffer[] = [];
        await new Promise(resolve => {
          request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          request.on('end', resolve);
        });
        const passThrough = new PassThrough();
        passThrough.end(Buffer.from(Buffer.concat(chunks).toString(), 'base64'));
        transcoder = new Transcoder(passThrough);
      } else {
        // For non-base64 uploads, we can just stream data.
        transcoder = new Transcoder(request);
      }

      await Promise.all([
        this.s3
          .upload({
            Bucket: getConfig().CLIP_BUCKET_NAME,
            Key: clipFileName,
            Body: transcoder.audioCodec('mp3').format('mp3').stream(),
          })
          .promise(),
      ]);
      const user = request.oidc.user as OidcUser;
      await UserClient.updateAvatarClipURL(user.email, clipFileName);

      response.json(clipFileName);
    } catch (error) {
      console.error(error);
      response.statusCode = error.statusCode || 500;
      response.statusMessage = 'save avatar clip error';
      response.json(error);
    }
  };

  getAvatarClip = async (request: OpenidRequest, response: Response) => {
    try {
      const {} = request;
      const user = request.oidc.user as OidcUser;
      let path = await UserClient.getAvatarClipURL(user.email);
      path = path[0][0].avatar_clip_url;

      let avatarclip = await this.bucket.getAvatarClipsUrl(path);
      response.json(avatarclip);
    } catch (err) {
      response.json(null);
    }
  };

  deleteAvatarClip = async (request: OpenidRequest, response: Response) => {
    const {} = request;
    const user = request.oidc.user as OidcUser;
    await UserClient.deleteAvatarClipURL(user.email);
    response.json('deleted');
  };

  getContributionActivity = async ({ client_id, query }: Request, response: Response) => {
    response.json(
      await (query.from == 'you'
        ? this.model.db.getContributionStats('de', client_id)
        : this.model.getContributionStats('de'))
    );
  };

  createCustomGoal = async (request: Request, response: Response) => {
    await CustomGoal.create(request.client_id, 'de', request.body);
    response.json({});
    sync(request.client_id).catch(e => console.error(e));
  };

  getGoals = async ({ client_id }: Request, response: Response) => {
    response.json({ globalGoals: await getGoals(client_id, 'de') });
  };

  claimUserClient = async ({ client_id, params }: Request, response: Response) => {
    if (!(await UserClient.hasSSO(params.client_id)) && client_id) {
      await UserClient.claimContributions(client_id, [params.client_id]);
    }
    response.json({});
  };

  seenAwards = async ({ client_id, query }: Request, response: Response) => {
    await Awards.seen(client_id, query.hasOwnProperty('notification') ? 'notification' : 'award');
    response.json({});
  };

  createReport = async ({ client_id, body }: Request, response: Response) => {
    await this.model.db.createReport(client_id, body);
    response.json({});
  };
  //TODO this is probably the url that causes the CSP violations => our bucket is not public anyway so we could probably remove it?
  getPublicUrl = async ({ params: { bucket_type, path, cdn } }: Request, response: Response) => {
    const url = await this.bucket.getPublicUrl(decodeURIComponent(path), bucket_type);
    response.json({ url });
  };

  markModalAsSeen = async ({ params, body }: Request, response: Response) => {
    const { modal_type } = params;
    const { email } = body;

    if (['speak-modal', 'listen-modal'].includes(modal_type)) {
      if (modal_type == 'speak-modal') {
        await UserClient.haveSeenSpeakModal(email);
      } else if (modal_type == 'listen-modal') {
        await UserClient.haveSeenListenModal(email);
      }
      const modalSettings = await UserClient.fetchModalSettings(email);
      return response.json({ success: true, modal_settings: modalSettings });
    }

    return response.json({ success: false, code: 403 });
  };

  fetchModalSettings = async ({ query, body }: Request, response: Response) => {
    let { email } = query;

    if (email) {
      email = email.toString();
      const fetchModalSettings = await UserClient.fetchModalSettings(email);

      return response.json({
        success: true,
        modal_settings: fetchModalSettings,
      });
    }

    return response.json({ success: false, message: 'email is required' });
  };
}
