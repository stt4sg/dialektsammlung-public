import { S3 } from 'aws-sdk';
import { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config-helper';
import { AWS } from './aws';
import Model from './model';
import getLeaderboard, { getRank } from './model/leaderboard';
import { earnBonus, hasEarnedBonus } from './model/achievements';
import Bucket from './bucket';
import { ClientParameterError, queryCursor, ServerError } from './utility';
import Awards from './model/awards';
import { checkGoalsAfterContribution } from './model/goals';
import { ChallengeToken, challengeTokens } from 'common';
import { sync } from './basket';

const PromiseRouter = require('express-promise-router');
const Transcoder = require('stream-transcoder');
/**
 * Clip - Responsibly for saving and serving clips.
 */
export default class Clip {
  private readonly s3: S3;
  private readonly bucket: Bucket;
  private readonly model: Model;

  constructor(model: Model) {
    this.s3 = AWS.getS3();
    this.model = model;
    this.bucket = new Bucket(this.model, this.s3);
  }

  getRouter() {
    const router = PromiseRouter({ mergeParams: true });
    router.use(({ client_id, params }: Request, response: Response, next: NextFunction) => {
      const { locale } = params;
      if (client_id && locale) {
        this.model.db
          .saveActivity(client_id, locale)
          .catch((error: any) => console.error('activity save error', error));
      }
      next();
    });
    router.post('/:clipId/votes', this.saveClipVote);
    router.post('*', this.saveClip);
    router.get('/validated_hours', this.serveValidatedHoursCount);
    router.get('/daily_count', this.serveDailyCount);
    router.get('/stats', this.serveClipsStats);
    router.get('/leaderboard', this.serveClipLeaderboard);
    router.get('/rank', this.serveRankLeaderboard);
    router.get('/votes/leaderboard', this.serveVoteLeaderboard);
    router.get('/voices', this.serveVoicesStats);
    router.get('/votes/daily_count', this.serveDailyVotesCount);
    router.get('/:clip_id', this.serveClip);
    router.get('*', this.serveRandomClips);
    return router;
  }

  serveClip = async ({ params }: Request, response: Response) =>
    response.redirect(await this.bucket.getClipUrl(params.clip_id));

  saveClipVote = async ({ client_id, body, params }: Request, response: Response) => {
    const id = params.clipId as string;
    const { isValid, challenge } = body;
    if (!id || !client_id) {
      response.statusMessage = 'save_clip_vote_missing_parameter';
      response.status(400).send(`Missing parameter: ${id ? 'client_id' : 'clip_id'}.`);
      throw new ClientParameterError();
    }
    const clip = await this.model.db.findClip(id);
    if (!clip) {
      response.statusMessage = 'save_clip_vote_missing_clip';
      response.status(422).send(`Clip not found: ${id}.`);
      throw new ServerError();
    }
    const glob = clip.path.replace('.mp3', '');
    await this.model.db.saveVote(id, client_id, isValid);
    await Awards.checkProgress(client_id, { id: clip.locale_id });
    await checkGoalsAfterContribution(client_id, { id: clip.locale_id });
    sync(client_id).catch(e => console.error(e));
    const ret = challengeTokens.includes(challenge)
      ? {
          glob: glob,
          showFirstContributionToast: await earnBonus('first_contribution', [challenge, client_id]),
          hasEarnedSessionToast: await hasEarnedBonus('invite_contribute_same_session', client_id, challenge),
          showFirstStreakToast: await earnBonus('three_day_streak', [client_id, client_id, challenge]),
          challengeEnded: await this.model.db.hasChallengeEnded(challenge),
        }
      : { glob };
    response.json(ret);
  };

  /**
   * Save the request body as an audio file.
   * TODO: Check for empty or silent clips before uploading.
   */
  saveClip = async (request: Request, response: Response) => {
    const { client_id, headers } = request;
    const sentenceId = headers.sentence_id as string;
    if (!sentenceId || !client_id) {
      response.statusMessage = 'save_clip_missing_parameter';
      response.status(400).send(`Missing parameter: ${sentenceId ? 'client_id' : 'sentence_id'}.`);
      console.log(`sent headers: ${JSON.stringify(headers)}`);
      throw new ClientParameterError();
    }
    const sentence = await this.model.db.findSentence(sentenceId);
    if (!sentence) {
      response.statusMessage = 'save_clip_missing_sentence';
      response.status(422).send(`Sentence not found: ${sentenceId}.`);
      throw new ServerError();
    }
    // Where is our audio clip going to be located?
    const folder = client_id + '/';
    const filePrefix = sentenceId;
    const clipFileName = folder + filePrefix + '.mp3';
    try {
      // If the folder does not exist, we create it.
      await this.s3.putObject({ Bucket: getConfig().CLIP_BUCKET_NAME, Key: folder }).promise();
      const transcoder = new Transcoder(request).audioCodec('mp3').format('mp3').channels(1).sampleRate(32000);
      await this.s3
        .upload({
          Bucket: getConfig().CLIP_BUCKET_NAME,
          Key: clipFileName,
          Body: transcoder.stream(),
        })
        .promise();
      console.log('clip written to s3', clipFileName);
      await this.model.saveClip({
        client_id: client_id,
        localeId: sentence.locale_id,
        original_sentence_id: sentenceId,
        path: clipFileName,
        sentence: sentence.text,
      });
      await Awards.checkProgress(client_id, { id: sentence.locale_id });
      await checkGoalsAfterContribution(client_id, { id: sentence.locale_id });
      sync(client_id).catch(e => console.error(e));
      const challenge = headers.challenge as ChallengeToken;
      const ret = challengeTokens.includes(challenge)
        ? {
            filePrefix: filePrefix,
            showFirstContributionToast: await earnBonus('first_contribution', [challenge, client_id]),
            hasEarnedSessionToast: await hasEarnedBonus('invite_contribute_same_session', client_id, challenge),
            showFirstStreakToast: await earnBonus('three_day_streak', [client_id, client_id, challenge]),
            challengeEnded: await this.model.db.hasChallengeEnded(challenge),
          }
        : { filePrefix };
      response.json(ret);
    } catch (error) {
      console.error(error);
      response.statusCode = error.statusCode || 500;
      response.statusMessage = 'save_clip_error';
      response.json(error);
    }
  };
  /**
   * @see Bucket.getRandomClips
   */
  serveRandomClips = async ({ client_id, params, query }: Request, response: Response): Promise<void> => {
    const clips = await this.bucket.getRandomClips(client_id, params.locale, parseInt(<string>query.count, 10) || 1);
    response.json(clips);
  };

  serveValidatedHoursCount = async (request: Request, response: Response) =>
    response.json(await this.model.getValidatedHours());
  serveDailyCount = async (request: Request, response: Response) =>
    response.json(await this.model.db.getDailyClipsCount(request.params.locale));
  serveDailyVotesCount = async (request: Request, response: Response) =>
    response.json(await this.model.db.getDailyVotesCount(request.params.locale));
  serveClipsStats = async ({ params }: Request, response: Response) =>
    response.json(await this.model.getClipsStats(params.locale));
  serveVoicesStats = async ({ params }: Request, response: Response) =>
    response.json(await this.model.getVoicesStats(params.locale));
  serveClipLeaderboard = async ({ client_id, params, query }: Request, response: Response) => {
    let return_values = await getLeaderboard({
      client_id,
      cursor: queryCursor(query),
    });
    let numberOfParticipants: number = return_values[0];
    let leaderboard: any[] = return_values[1];
    let myRankResult = await getRank(client_id);

    response.json({
      leaderboard: leaderboard,
      my_rank: myRankResult.myRank,
      numberOfParticipants: numberOfParticipants,
    });
  };

  serveRankLeaderboard = async ({ client_id }: Request, response: Response) => {
    response.json(await getRank(client_id));
  };

  serveVoteLeaderboard = async ({ client_id, params, query }: Request, response: Response) => {
    response.json(await getLeaderboard({ client_id, cursor: queryCursor(query) }));
  };
}
