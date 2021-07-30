import DB from './model/db';
import { DBClipWithVoters } from './model/db/tables/clip-table';
import lazyCache from './lazy-cache';

// based on the latest dataset
const AVG_CLIP_SECONDS = 4.746;
const AVG_CLIP_SECONDS_PER_LOCALE: { [locale: string]: number } = {
  en: 4.958,
  fa: 4.043,
  fr: 4.872,
  es: 4.946,
  sl: 3.93,
  kab: 3.297,
  cy: 4.734,
  ca: 5.386,
  de: 4.95,
  tt: 3.719,
  ta: 4.264,
  ru: 5.384,
  nl: 4.079,
  it: 5.558,
  eu: 5.14,
  tr: 3.906,
  ar: 4.101,
  'zh-TW': 3.234,
  br: 3.03,
  pt: 4.389,
  eo: 5.625,
  'zh-CN': 5.549,
  id: 3.873,
  ia: 4.007,
  lv: 3.396,
  ja: 4.423,
  rw: 5.116,
  'sv-SE': 3.461,
  cnh: 3.563,
  et: 6.672,
  ky: 4.654,
  ro: 4.018,
  hsb: 6.101,
  el: 4.147,
  cs: 4.26,
  pl: 4.31,
  'rm-sursilv': 5.501,
  'rm-vallader': 5.738,
  mn: 5.473,
  'zh-HK': 4.326,
  ab: 6.595,
  cv: 5.003,
  uk: 4.977,
  mt: 4.742,
  as: 5.301,
  ka: 5.698,
  'fy-NL': 5.106,
  dv: 5.513,
  'pa-IN': 4.879,
  vi: 4.311,
  or: 5.121,
  'ga-IE': 3.479,
  fi: 4.564,
  hu: 4.512,
  sah: 5.989,
  vot: 2.402,
  th: 4.375,
  lg: 5.265,
  lt: 5.212,
  hi: 4.692,
};

const getAvgSecondsPerClip = (locale: string) => AVG_CLIP_SECONDS_PER_LOCALE[locale] || AVG_CLIP_SECONDS;

const MINUTE = 1000 * 60;
const DAY = MINUTE * 60 * 24;
/**
 * The Model loads all clip and user data into memory for quick access.
 */
export default class Model {
  db = new DB();

  /**
   * Fetch a random clip but make sure it's not the user's.
   * @see DB.findClipsNeedingValidation
   */
  async findEligibleClips(client_id: string, locale: string, count: number): Promise<DBClipWithVoters[]> {
    return this.db.findClipsNeedingValidation(client_id, locale, Math.min(count, 50));
  }

  /**
   * @see DB.findSentencesNeedingClips
   */
  findEligibleSentences = (client_id: string, count: number) =>
    this.db.findSentencesNeedingClips(client_id, Math.min(count, 50));

  /**
   * Ensure the database is properly set up.
   */
  ensureDatabaseSetup = async () => await this.db.ensureSetup();

  /**
   * Upgrade to the latest version of the db.
   */
  async performMaintenance(): Promise<void> {
    await this.db.ensureLatest();
  }

  /**
   * Perform any cleanup work to the model before shutting down.
   */
  cleanUp(): void {
    this.db.endConnection();
  }

  async saveClip(clipData: {
    client_id: string;
    localeId: number;
    original_sentence_id: string;
    path: string;
    sentence: string;
  }) {
    await this.db.saveClip(clipData);
  }

  getValidatedHours = lazyCache(
    'validated-hours',
    async () => {
      const german = (await this.db.getValidClipCount(['de']))[0];
      return Math.round(((german ? german.count : 0) * getAvgSecondsPerClip('de')) / 3600);
    },
    DAY
  );

  getClipsStats = lazyCache(
    'overall-clips-stats',
    async (locale: string) =>
      (await this.db.getClipsStats(locale)).map(stat => ({
        ...stat,
        total: Math.round(stat.total * getAvgSecondsPerClip(locale)),
        valid: Math.round(stat.valid * getAvgSecondsPerClip(locale)),
      })),
    DAY / 2
  );

  getVoicesStats = lazyCache('voice-stats', (locale: string) => this.db.getVoicesStats(locale), 20 * MINUTE);

  getContributionStats = lazyCache(
    'contribution-stats',
    (locale?: string) => this.db.getContributionStats(locale),
    20 * MINUTE
  );
}
