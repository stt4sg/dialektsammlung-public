export const up = async function (db: any): Promise<any> {
  return db.runSql(`alter table sentences add column original_id varchar(25) DEFAULT NULL;`);
};
export const down = function (): Promise<any> {
  return null;
};
