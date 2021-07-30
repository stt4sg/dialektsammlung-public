import * as eventStream from 'event-stream';
import * as fs from 'fs';
import * as path from 'path';
import { PassThrough } from 'stream';
import promisify from '../../../promisify';
import { hashSentence } from '../../utility';
import { getConfig } from '../../../config-helper';

const CWD = process.cwd();
const SENTENCES_FOLDER = path.resolve(CWD, 'server/data/');

// for sources with sentences that are likely to have repeats across
// locales, we want to generate a unique hash for each locale + sentence,
// not just each sentence
const LOCALE_HASH_SOURCES = ['singleword-benchmark'];

function print(...args: any[]) {
  args.unshift('IMPORT --');
  console.log.apply(console, args);
}

async function getFilesInFolder(path: string): Promise<string[]> {
  const fileNames = await promisify(fs, fs.readdir, path);
  return fileNames.map((name: string) => {
    return path + '/' + name;
  });
}

/**
 * For better performance the function loads the sentences in chunks of 500.
 */
function streamSentences(localePath: string): PassThrough {
  const SENTENCES_PER_CHUNK = 500;
  const stream = new PassThrough({ objectMode: true });
  getFilesInFolder(localePath)
    .then(p => p.filter((name: string) => name.endsWith('.csv')))
    .then(async filePaths => {
      for (const filePath of filePaths) {
        const source = path.basename(filePath).split('.')[0];
        let sentences: string[] = [];

        function write() {
          stream.write({ sentences, source });
          sentences = [];
        }

        await new Promise(resolve => {
          const fileStream = fs
            .createReadStream(filePath)
            .pipe(eventStream.split())
            .pipe(
              eventStream
                .mapSync((line: string) => {
                  fileStream.pause();
                  if (line.length > 0) {
                    //filter empty lines
                    sentences.push(line);
                  }
                  if (sentences.length >= SENTENCES_PER_CHUNK) {
                    write();
                  }
                  fileStream.resume();
                })
                .on('end', () => {
                  if (sentences.length > 0) {
                    write();
                  }
                  resolve(undefined);
                })
            );
        });
      }
      stream.end();
    });
  return stream;
}

/**
 * Imports all the sentences new & old from the filesystem, they are deduplicated using sha256 on the sentence.
 * For better performance the streamSentences function loads the sentences in chunks before loading them.
 */
async function importLocaleSentences(pool: any, locale: string, version: number) {
  await pool.query('INSERT IGNORE INTO locales (name) VALUES (?)', [locale]);
  const [[{ localeId }]] = await pool.query('SELECT id AS localeId FROM locales WHERE name = ? LIMIT 1', [locale]);
  await new Promise(async resolve => {
    print('importing', locale);
    const stream = streamSentences(path.join(SENTENCES_FOLDER, locale));
    stream
      .on('data', async ({ sentences, source }: { sentences: string[]; source: string }) => {
        stream.pause();
        //nested arrays are escaped.
        const values = sentences
          .map(sentence => sentence.match(/([^;]+); ?(.+)/))
          .map(split => {
            const original_id = split[1].trim();
            const sentence = split[2].trim();
            return LOCALE_HASH_SOURCES.includes(source)
              ? [hashSentence(localeId + sentence), sentence, true, localeId, source, version, original_id]
              : [hashSentence(sentence), sentence, true, localeId, source, version, original_id];
          });
        const result = await importLocaleSentencesQuery(pool, values, sentences);
        if (result) {
          console.log('try only once more');
          await importLocaleSentencesQuery(pool, values, sentences);
        }
        stream.resume();
      })
      .on('end', resolve);
  });
}

async function importLocaleSentencesQuery(pool: any, values: any[][], sentences: string[]) {
  try {
    await pool.query(
      `INSERT INTO sentences (\`id\`, \`text\`, \`is_used\`, \`locale_id\`, \`source\`, \`version\`, \`original_id\`)
            VALUES ?
            ON DUPLICATE KEY UPDATE 
            source = VALUES (source),
            version = VALUES (version),
            is_used = VALUES (is_used);`,
      [values]
    );
    return false;
  } catch (e) {
    console.error(
      `error when inserting sentence batch from "${sentences[0]}" to "${sentences[sentences.length - 1]}":${e}`
    );
    return true;
  }
}

/**
 * If a new sentence version is released the SENTENCE_VERSION in the config-helper.ts should be updated.All the
 * sentences new & old are then imported from the filesystem, they are not deduplicated.
 *
 * NOTE: this deletes all old sentences except the ones we already have recordings for, these are not deleted but just hidden
 */
export async function importSentences(pool: any) {
  const oldVersion = (
    (await pool.query('select max(version) as oldVersion from sentences;')) as {
      oldVersion: number;
    }[][]
  )[0][0].oldVersion;
  if (oldVersion < getConfig().SENTENCE_VERSION) {
    const version = getConfig().SENTENCE_VERSION;
    await importLocaleSentences(pool, 'de', version);
    await pool.query(
      `
        DELETE
        FROM sentences
        WHERE id NOT IN (SELECT original_sentence_id FROM clips)
          AND id NOT IN (SELECT sentence_id FROM skipped_sentences)
          AND id NOT IN (SELECT sentence_id FROM taxonomy_entries)
          AND version <> ?
      `,
      [version]
    );
    await pool.query('UPDATE sentences SET is_used = FALSE WHERE version <> ?', [version]);
    const [localeCounts] = (await pool.query(
      `
        SELECT locales.name AS locale, COUNT(*) AS count
        FROM sentences
               LEFT JOIN locales ON locale_id = locales.id
        WHERE is_used
        GROUP BY locale_id
      `
    )) as { locale: string; count: number }[][];

    print(
      'sentences',
      JSON.stringify(
        localeCounts.reduce((obj, { count, locale }) => {
          obj[locale] = count;
          return obj;
        }, {} as { [locale: string]: number }),
        null,
        2
      )
    );
  }
}
