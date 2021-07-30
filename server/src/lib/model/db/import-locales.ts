import { getMySQLInstance } from './mysql';

const db = getMySQLInstance();

export async function importLocales() {
  await db.query('INSERT IGNORE INTO locales (name) VALUES ?', [['de'].map(l => [l])]);
}
