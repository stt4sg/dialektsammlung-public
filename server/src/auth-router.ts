import { NextFunction, Response } from 'express';
import * as session from 'express-session';
import UserClient from './lib/model/user-client';
import DB from './lib/model/db';
import { getConfig } from './config-helper';
import { auth, OpenidRequest, OpenidResponse, Session } from 'express-openid-connect';
import base64url from 'base64url';
import { earnBonus } from './lib/model/achievements';

const PromiseRouter = require('express-promise-router');
const MySQLStore = require('express-mysql-session')(session);
const {
  MYSQLHOST,
  MYSQLDBNAME,
  MYSQLUSER,
  MYSQLPASS,
  SECRET,
  BASE_URL,
  AUTH0: { DOMAIN, CLIENT_ID, CLIENT_SECRET },
} = getConfig();
const router = PromiseRouter();
if (DOMAIN) {
  /**
   * @see https://github.com/auth0/express-openid-connect/blob/master/EXAMPLES.md for customization
   */
  router.use(
    auth({
      issuerBaseURL: 'https://' + DOMAIN,
      baseURL: BASE_URL,
      clientID: CLIENT_ID,
      secret: SECRET,
      idpLogout: true,
      authRequired: false,
      clientSecret: CLIENT_SECRET,
      authorizationParams: {
        response_type: 'code id_token',
      },
      afterCallback: afterCallback,
      routes: {
        //NOTE: this is needed for some reason even though it is the same as the default url ;)
        postLogoutRedirect: BASE_URL,
      },
      session: {
        store: new MySQLStore({
          host: MYSQLHOST,
          user: MYSQLUSER,
          password: MYSQLPASS,
          database: MYSQLDBNAME,
          createDatabaseTable: false,
        }),
      },
    })
  );
}

/**
 * @see https://github.com/auth0/express-openid-connect/blob/master/EXAMPLES.md#8-validate-claims-from-an-id-token-before-logging-a-user-in
 */
async function afterCallback(
  request: OpenidRequest,
  response: OpenidResponse,
  session: Session,
  decodedState: { [key: string]: any }
): Promise<Session> {
  const claims: any = JSON.parse(joseDecode(session.id_token).toString());

  //TODO some of these are probably always undefined
  const { old_user, old_email, redirect, enrollment, email, email_verified } = claims;
  session.user = claims; //not sure this is actually needed/secure but we did it previously...
  const basePath = BASE_URL + '/de/';
  if (!claims) {
    decodedState.returnTo = basePath + 'login-failure';
  } else if (!email_verified) {
    decodedState.returnTo = '/de/verification-needed';
  } else if (old_user) {
    //TODO not sure this logic is used at all.
    const success = await UserClient.updateSSO(old_email, email);
    if (!success) {
      session.user = old_user;
    }
    decodedState.returnTo = '/profile/settings?success=' + success.toString();
  } else if (enrollment?.challenge && enrollment.team) {
    //TODO not sure this logic is used at all.
    if (
      !(await UserClient.enrollRegisteredUser(
        email,
        enrollment.challenge,
        enrollment.team,
        enrollment.invite,
        enrollment.referer
      ))
    ) {
      // if the user is unregistered, pass enrollment to frontend
      claims.enrollment = enrollment;
    } else {
      // if the user is already registered, now he/she should be enrolled
      // [TODO] there should be an elegant way to get the client_id here
      const client_id = await UserClient.findClientId(email);
      await earnBonus('sign_up_first_three_days', [enrollment.challenge, client_id]);
      await earnBonus('invite_signup', [client_id, enrollment.invite, enrollment.invite, enrollment.challenge]);
    }
    // [BUG] try refresh the challenge board, toast will show again, even though DB won't give it the same achievement again
    decodedState.returnTo = redirect || `${basePath}login-success?challenge=${enrollment.challenge}&achievement=1`;
  } else {
    //TODO this seems to be the expected redirect
    decodedState.returnTo = redirect || basePath + 'login-success';
  }
  return session;
}

/**
 * taken from `require('jose').jose.JWT.decode` as this library does not work in typescript ;(
 */
const joseDecode = (token: string, { complete = false } = {}) => {
  if (typeof token !== 'string' || !token) {
    throw new TypeError('JWT must be a string');
  }
  const { 0: header, 1: payload, 2: signature, length } = token.split('.');
  if (length === 5) {
    throw new TypeError('encrypted JWTs cannot be decoded');
  }
  if (length !== 3) {
    throw new TypeError('JWTs must have three components');
  }
  try {
    const result = { header: base64url.decode(header), payload: base64url.decode(payload), signature };
    return complete ? result : result.payload;
  } catch (err) {
    throw new TypeError('JWT is malformed');
  }
};
export default router;
const db = new DB();

export async function authMiddleware(request: OpenidRequest, response: Response, next: NextFunction) {
  const user: any = request.oidc.user;
  if (request.oidc.isAuthenticated()) {
    const accountClientId = await UserClient.findClientId(user.email);
    if (accountClientId) {
      request.client_id = accountClientId;
      next();
      return;
    }
  }
  //TODO not sure this logic is used at all.
  const [authType, credentials] = (request.header('Authorization') || '').split(' ');
  if (authType === 'Basic') {
    const [client_id, auth_token] = Buffer.from(credentials, 'base64').toString().split(':');
    if (await UserClient.hasSSO(client_id)) {
      response.sendStatus(401);
      return;
    } else {
      const verified = await db.createOrVerifyUserClient(client_id, auth_token);
      if (!verified) {
        response.sendStatus(401);
        return;
      }
    }
    request.client_id = client_id;
  }
  next();
}

/**
 * example:'{"nickname":"test","name":"test@test.ch",
 * "picture":"https://s.gravatar.com/avatar/bdd302824c4fbccd1587e005c7c48e34?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fel.png",
 * "updated_at":"2021-05-05T13:39:03.955Z","email":"test@test.ch","email_verified":true,"iss":"https://test.eu.auth0.com/",
 * "sub":"secret","aud":"secret","iat":1620294343,"exp":1620330343,"nonce":"secret"}'
 */
export interface OidcUser {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  /**
   * the auth0 user id
   */
  sub: string;
  /**
   * not definded in the oidc ;(
   */
  enrollment: string;
}
