export const up = async function (db: any): Promise<any> {
  return db.runSql(`
    ALTER TABLE user_clients
    ADD COLUMN wants_newsletter BOOLEAN DEFAULT FALSE
  `);
};

export const down = function (): Promise<any> {
  return null;
};
