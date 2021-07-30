export const up = async function (db: any): Promise<any> {
  return db.runSql(`alter table user_clients
    add column zipcode varchar(6),
    add column canton varchar(2);`);
};
export const down = function (): Promise<any> {
  return null;
};
