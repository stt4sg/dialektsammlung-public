import { existsSync, readdirSync, readFileSync } from 'fs';
import { Server as HttpServer } from 'http';
import { join } from 'path';
import * as express from 'express';
import { Application, NextFunction, Request, Response, static as eStatic } from 'express';
import { importLocales } from './lib/model/db/import-locales';
import { importTargetSegments } from './lib/model/db/import-target-segments';
import { scrubUserActivity } from './lib/model/db/scrub-user-activity';
import Model from './lib/model';
import API from './lib/api';
import { APIError, ClientError, getElapsedSeconds } from './lib/utility';
import { importSentences } from './lib/model/db/import-sentences';
import { getConfig, isDev } from './config-helper';
import authRouter from './auth-router';
import fetchDocument from './fetch-document';

interface ResponseError extends Error {
  status?: number;
}
const HttpStatus = require('http-status-codes');
require('source-map-support').install();
const FULL_CLIENT_PATH = join(__dirname, '..', '..', 'web');
const ENVIRONMENT = getConfig().ENVIRONMENT;
const SECONDS_IN_A_YEAR = 365 * 24 * 60 * 60;

const CSP_HEADER = [
  `default-src 'none'`,
  `child-src 'self' blob:`,
  `style-src 'self' https://fonts.googleapis.com 'unsafe-inline'`,
  `img-src 'self' www.google-analytics.com www.gstatic.com https://www.gstatic.com https://gravatar.com https://*.mozilla.org https://*.allizom.org data:`,
  `media-src data: blob: https://*.amazonaws.com https://*.amazon.com http://localhost:8080`,
  // Note: we allow unsafe-eval locally for certain webpack functionality.
  `script-src 'self' 'unsafe-eval' 'sha256-lqwpyzVeAXcWt+X/YqrfRyBuDnsUSh9gzx7RoSTHBnA=' 'sha256-Kw4BTTjyMQp+nLt1SjNHyQPmH1nS80fNc9mHIwRIAHU=' https://www.google-analytics.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `connect-src 'self' blob: https://*.amazonaws.com https://*.amazon.com https://www.gstatic.com https://www.google-analytics.com https://basket.mozilla.org https://basket-dev.allizom.org`,
].join(';');
/**
 * Feature Policy allows web developers to selectively enable, disable, and modify the behavior of certain features and
 * APIs in the browser. It is similar to Content Security Policy but controls features instead of security behavior
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
 */
const FP_HEADER = [
  `autoplay 'self'`,
  `unsized-media 'self'`,
  `microphone 'self'`,

  `accelerometer 'none'`,
  `ambient-light-sensor 'none'`,
  `battery 'none'`,
  `camera 'none'`,
  `display-capture 'none'`,
  `document-domain 'none'`,
  `encrypted-media 'none'`,
  `execution-while-not-rendered 'none'`,
  `execution-while-out-of-viewport 'none'`,
  `fullscreen 'none'`,
  `geolocation 'none'`,
  `gyroscope 'none'`,
  `layout-animations 'none'`,
  `legacy-image-formats 'none'`,
  `magnetometer 'none'`,
  `midi 'none'`,
  `navigation-override 'none'`,
  `oversized-images 'none'`,
  `payment 'none'`,
  `picture-in-picture 'none'`,
  `publickey-credentials-get 'none'`,
  `sync-xhr 'none'`,
  `usb 'none'`,
  `vr 'none'`,
  `wake-lock 'none'`,
  `screen-wake-lock 'none'`,
  `web-share 'none'`,
  `xr-spatial-tracking 'none'`,
].join(';');

export default class Server {
  app: Application;
  server: HttpServer;
  model: Model;
  api: API;
  isLeader: boolean;

  constructor(options?: { bundleCrossLocaleMessages: boolean }) {
    options = { bundleCrossLocaleMessages: true, ...options };
    this.model = new Model();
    this.api = new API(this.model);
    this.isLeader = null;

    const app = (this.app = express());

    const staticOptions = {
      setHeaders: (response: Response) => {
        // Basic Information
        response.set('X-Release-Version', null); //TODO remove this?
        response.set('X-Environment', ENVIRONMENT); //TODO remove this?

        // security-centric headers
        response.set('X-Production', 'Off'); //TODO remove this?
        response.set('Content-Security-Policy', CSP_HEADER);
        response.set('Feature-Policy', FP_HEADER); //renamed to Permissions-Policy in newer browsers
        response.set('Permissions-Policy', FP_HEADER);
        response.set('X-Content-Type-Options', 'nosniff');
        response.set('X-XSS-Protection', '1; mode=block');
        response.set('X-Frame-Options', 'DENY');
        response.set('Strict-Transport-Security', 'max-age=' + SECONDS_IN_A_YEAR);
      },
    };
    app.use((request, response, next) => {
      // redirect to omit trailing slashes
      if (request.path.substr(-1) == '/' && request.path.length > 1) {
        const query = request.url.slice(request.path.length);
        const host = request.get('host');
        response.redirect(HttpStatus.MOVED_PERMANENTLY, `https://${host}${request.path.slice(0, -1)}${query}`);
      } else {
        next();
      }
    });
    app.use(authRouter);
    app.use('/api/v1', this.api.getRouter());
    app.use(eStatic(FULL_CLIENT_PATH, staticOptions));
    app.use('/contribute.json', eStatic(join(__dirname, '..', '..', 'contribute.json')));
    if (options.bundleCrossLocaleMessages) {
      this.setupCrossLocaleRoute();
    }
    this.setupDocRoutes();
    app.use(/(.*)/, eStatic(FULL_CLIENT_PATH + '/index.html', staticOptions));
    // development error handler
    // will print stacktrace
    if (isDev()) {
      app.use((error: Error, request: Request, response: Response) => {
        console.log(error.message, error.stack);
        const isAPIError = error instanceof APIError;
        if (!isAPIError) {
          console.error(request.url, error.message, error.stack);
        }
        response
          .status(error instanceof ClientError ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: isAPIError ? error.message : '' });
      });
    } else {
      // production error handler
      // no stacktraces leaked to user
      app.use(function (err: ResponseError, req: Request, res: Response, next: NextFunction) {
        res.status(err.status || 500);
        res.json({ message: HttpStatus.getStatusText(err.status || 500) });
      });
    }
  }

  /**
   * Log application level messages in a common format.
   */
  private static print(...args: any[]) {
    args.unshift('APPLICATION --');
    console.log.apply(console, args);
  }

  /**
   * Start up everything.
   * @param options.doImport used  so we do not import everything for testing
   */
  async run(options?: { doImport: boolean }): Promise<void> {
    options = { doImport: true, ...options };
    Server.print('starting');
    await this.ensureDatabase();
    this.listen();
    //TODO we do not lock the database, but have to ensure that only one new instance(with new migrations) is connected
    // at a time, this should not be a problem as Fargate should only start one instance at a time for new version to
    // ensure high-availability
    await this.performMaintenance(options.doImport);
  }

  /**
   * Kill the http server if it's running.
   */
  kill(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.model.cleanUp();
  }

  /**
   * Reset the database to initial factory settings.
   */
  async resetDatabase(): Promise<void> {
    await this.model.db.drop();
    await this.model.ensureDatabaseSetup();
  }

  async emptyDatabase() {
    await this.model.db.empty();
  }

  /**
   * Boot up the http server.
   */
  private listen(): void {
    // Begin handling requests before clip list is loaded.
    let port = getConfig().SERVER_PORT;
    this.server = this.app.listen(port, () => Server.print(`listening at http://localhost:${port}`));
  }

  /**
   * Make sure we have a connection to the database.
   */
  private async ensureDatabase(): Promise<void> {
    try {
      await this.model.ensureDatabaseSetup();
    } catch (err) {
      console.error('could not connect to db', err);
    }
  }

  /**
   * Perform any scheduled maintenance on the data model.
   */
  private async performMaintenance(doImport: boolean): Promise<void> {
    const start = Date.now();
    Server.print('performing Maintenance');
    try {
      await this.model.performMaintenance();
      await scrubUserActivity();
      await importLocales();
      if (doImport) {
        await importSentences(await this.model.db.mysql.createPool());
      }
      await importTargetSegments();
      Server.print('Maintenance complete');
    } catch (err) {
      Server.print('Maintenance error', err);
    } finally {
      Server.print(`${getElapsedSeconds(start)}s to perform maintenance`);
    }
  }

  private setupCrossLocaleRoute() {
    const localesPath = join(FULL_CLIENT_PATH, 'locales');
    const crossLocaleMessages = readdirSync(localesPath).reduce((obj: any, locale: string) => {
      const filePath = join(localesPath, locale, 'cross-locale.ftl');
      if (existsSync(filePath)) {
        obj[locale] = readFileSync(filePath, 'utf-8');
      }
      return obj;
    }, {});

    this.app.get('/cross-locale-messages.json', (request, response) => {
      response.json(crossLocaleMessages);
    });
  }

  private setupDocRoutes() {
    this.app.get('/privacy.html', async (request, response) => {
      response.send(await fetchDocument('privacy_notice', false));
    });
    this.app.get('/terms.html', async (request, response) => {
      response.send(await fetchDocument('terms', false));
    });
    this.app.get('/challenge-terms.html', async (request, response) => {
      response.send(await fetchDocument('terms', false)); // we don't have a dedicated challenge_terms sheet yet
    });
    this.app.get('/pr-coverage.html', async (request, response) => {
      response.send(await fetchDocument('coverage', true)); // some fancy pr shiet
    });
  }
}
