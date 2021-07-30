'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options: any, seedLink: any) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db: any) {
  return db.runSql(`alter table user_clients
    add column seen_speak_modal  tinyint(1) NOT NULL DEFAULT 0,
    add column seen_listen_modal tinyint(1) NOT NULL DEFAULT 0;`);
};

exports.down = function (db: any): any {
  return null;
};

exports._meta = {
  version: 1,
};
