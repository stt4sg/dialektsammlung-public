import { SHA256 } from 'crypto-js';
import { getConfig } from '../../config-helper';
import lazyCache from '../lazy-cache';
import { getMySQLInstance } from './db/mysql';
import Bucket from '../bucket';
import { AWS } from '../aws';
import Model from '../model';
import { Rank } from 'common';
import omit = require('lodash.omit');

const s3 = AWS.getS3();
const model = new Model();
const bucket = new Bucket(model, s3);

const db = getMySQLInstance();

const STRecording = 5;
const STValidation = 1;

/**
 * This method calculates the leaderboard and returns the rank of the selected client.
 * The rank will be calculated by enumerating the leaderboard.
 * @param client_id
 */
export const getRank = async function getRank(client_id: string): Promise<Rank> {
  //FIXME not suer how performant this @rownum := @rownum + 1 query is as it emulates the ROW_NUMBER() function present in newer mysql versions
  const [rows] = await db.query(
    `SELECT *
     FROM (
            SELECT *, @rownum := @rownum + 1 AS rank
            FROM (
              SELECT t0.client_id,
              username,
              (SELECT @rownum := 0) AS rownum,
              CAST((
              (recordings *
              IF(IF(count_total IS NULL, 0, count_total) >= 10,
              IF(count_correct IS NULL, 0, count_correct) / IF(count_total IS NULL, 0, count_total),
              0.5)) * ${STRecording}
              + validating * ${STValidation}) AS UNSIGNED INTEGER) AS total
              FROM (SELECT user_clients.client_id, avatar_url, avatar_clip_url, username, count_correct, count_total
              FROM user_clients
              LEFT JOIN
              (SELECT clips.client_id, COUNT(clips.client_id) AS count_correct
              FROM clips
              INNER JOIN votes v ON clips.id = v.clip_id
              WHERE v.is_valid
              GROUP BY clips.client_id) t01 ON t01.client_id = user_clients.client_id

              LEFT JOIN
              (SELECT clips.client_id, COUNT(clips.client_id) AS count_total
              FROM clips
              INNER JOIN votes v ON clips.id = v.clip_id
              GROUP BY clips.client_id) t02 on t02.client_id = user_clients.client_id
              WHERE visible = 1) t0,

              (SELECT user_clients.client_id, COUNT(clips.id) AS recordings
              FROM user_clients
              LEFT JOIN clips ON user_clients.client_id = clips.client_id
              GROUP BY user_clients.client_id) t1,
              (SELECT user_clients.client_id, COUNT(votes.id) AS validating
              FROM user_clients
              LEFT JOIN votes ON user_clients.client_id = votes.client_id
              GROUP BY user_clients.client_id) t2
              WHERE t0.client_id = t1.client_id
              AND t0.client_id = t2.client_id
              ) t
            ORDER BY total DESC, username
          ) t1
     WHERE client_id = ?
  `,
    [client_id]
  );

  let myRank = 0;
  let mySchoggitaler = 0;
  if (rows.length > 0) {
    myRank = rows[0].rank;
    mySchoggitaler = rows[0].total;
  }

  return { myRank, mySchoggitaler };
};

/**
 * Calculates the leaderboard
 * - per Recording: STRecording ST
 * - per Validation: STValidation ST
 * - Recording will be multiplied by an acceptance ration ar:
 *  - ar = number of positive votes on user's recordings / number of total votes on user's recordings
 *  - ar = 0.5 if number of votes less than 10.
 */
async function getSchoggitalerLeaderboard(): Promise<any[]> {
  const [rows] = await db.query(
    `SELECT t0.client_id,
            avatar_url,
            avatar_clip_url,
            username,
            CAST((
              (recordings *
              IF(IF(count_total IS NULL, 0, count_total) >= 10,
              IF(count_correct IS NULL, 0, count_correct) / IF(count_total IS NULL, 0, count_total),
              0.5)) * ${STRecording}
              + validating * ${STValidation}) AS UNSIGNED INTEGER) AS total
     FROM (SELECT user_clients.client_id, avatar_url, avatar_clip_url, username, count_correct, count_total
           FROM user_clients
                  LEFT JOIN
                (SELECT clips.client_id, COUNT(clips.client_id) AS count_correct
                 FROM clips
                        INNER JOIN votes v ON clips.id = v.clip_id
                 WHERE v.is_valid
                 GROUP BY clips.client_id) t01 ON t01.client_id = user_clients.client_id

                  LEFT JOIN
                (SELECT clips.client_id, COUNT(clips.client_id) AS count_total
                 FROM clips
                        INNER JOIN votes v ON clips.id = v.clip_id
                 GROUP BY clips.client_id) t02 on t02.client_id = user_clients.client_id
           WHERE visible = 1) t0,

          (SELECT user_clients.client_id, COUNT(clips.id) AS recordings
           FROM user_clients
                  LEFT JOIN clips ON user_clients.client_id = clips.client_id
           GROUP BY user_clients.client_id) t1,

          (SELECT user_clients.client_id, COUNT(votes.id) AS validating
           FROM user_clients
                  LEFT JOIN votes ON user_clients.client_id = votes.client_id
           GROUP BY user_clients.client_id) t2
     WHERE t0.client_id = t1.client_id
       AND t0.client_id = t2.client_id
     ORDER BY total DESC, username;
    `
  );
  return rows;
}

const CACHE_TIME_MS = 0;

export const getFullLeaderboard = lazyCache(
  'vote-leaderboard',
  async () => {
    return (await getSchoggitalerLeaderboard()).map((row, i) => ({
      position: i,
      ...row,
    }));
  },
  CACHE_TIME_MS
);

/**
 * this leaderboard functionality includes: cursor and assigning positions.
 */
export default async function getLeaderboard({
  client_id,
  cursor,
}: {
  client_id: string;
  cursor?: [number, number];
}): Promise<[number, any[]]> {
  const prepareRows = (rows: any[]) =>
    rows.map(row => ({
      ...omit(row, 'client_id', 'avatar_clip_url'),
      avatarClipUrl: row.avatar_clip_url ? bucket.getAvatarClipsUrl(row.avatar_clip_url) : null,
      clientHash: SHA256(row.client_id + getConfig().SECRET).toString(),
      you: row.client_id == client_id,
    }));

  let leaderboard = await getFullLeaderboard();

  if (cursor) {
    return [leaderboard.length, prepareRows(leaderboard.slice(cursor[0], cursor[1]))];
  }

  const userIndex = leaderboard.findIndex(row => row.client_id == client_id);
  const userRegion = userIndex == -1 ? [] : leaderboard.slice(userIndex - 1, userIndex + 2);
  const partialBoard = [...leaderboard.slice(0, 10 + Math.max(0, 10 - userRegion.length)), ...userRegion];
  return [
    leaderboard.length,
    prepareRows(partialBoard.filter(({ position }, i) => i == partialBoard.findIndex(row => row.position == position))),
  ];
}
