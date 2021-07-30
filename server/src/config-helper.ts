import { readFileSync } from 'fs';
import { S3 } from 'aws-sdk';

export enum Environment {
  default = 'default',
  main = 'main',
  release = 'release',
}
export class CommonVoiceConfig {
  SERVER_PORT = 9000;
  /**
   * the default is root because we have semi-intelligent test ;)
   */
  MYSQLUSER = 'root';
  MYSQLPASS = 'voicecommons';
  MYSQLDBNAME = 'voiceweb';
  MYSQLHOST = 'localhost';
  MYSQLPORT = 3306;
  CLIP_BUCKET_NAME = 'common-voice-corpus';
  /**
   * @deprecated TODO remove this?
   */
  DATASET_BUCKET_NAME = 'common-voice-corpus';
  BUCKET_LOCATION = '';
  ENVIRONMENT = Environment.default;
  /**
   * @note this is always the same and should be left alone
   */
  SECRET = 'super-secure-secret';
  /**
   * only needs to be changed for server deployments
   */
  S3_CONFIG: S3.Types.ClientConfiguration = {
    endpoint: 'http://localhost:8080',
    accessKeyId: 'local-identity',
    secretAccessKey: 'local-credential',
    s3ForcePathStyle: true,
  };
  /**
   * needs to be changed for both local & server deployments
   */
  AUTH0 = { DOMAIN: '', CLIENT_ID: '', CLIENT_SECRET: '' };
  /**
   * needs to be changed for both local & server deployments
   */
  AUTH0_API_V2 = { DOMAIN: '', CLIENT_ID: '', CLIENT_SECRET: '' };
  SENTENCE_VERSION = 3;
  /**
   * baseurl based on environments used for release candidates
   */
  BASE_URL = '';
}

let loadedConfig: CommonVoiceConfig;
export const isProd = (): boolean => getConfig().ENVIRONMENT === Environment.main;
export const isDev = (): boolean => getConfig().ENVIRONMENT === Environment.default;
export function getConfig(): CommonVoiceConfig {
  if (loadedConfig) {
    return loadedConfig;
  }
  loadedConfig = new CommonVoiceConfig();
  try {
    const fileConfig = JSON.parse(readFileSync(process.env.SERVER_CONFIG_PATH || './config.json', 'utf-8'));
    loadedConfig = { ...loadedConfig, ...fileConfig };
  } catch (err) {
    console.error(`Could not load config.json, using defaults (error message: ${err.message})`);
  }
  loadedConfig.BASE_URL =
    (
      {
        release: 'https://stagingdomain.ch',
        main: 'https://dialektsammlung.ch',
        default: 'http://localhost:9000',
      } as any
    )[loadedConfig.ENVIRONMENT] || '';
  return loadedConfig;
}
