import { isAbsolute, join, resolve } from 'path';
import Mysql from './mysql';
import { getConfig } from '../../../config-helper';

const DBMigrate = require('db-migrate');
export default class Schema {
  private mysql: Mysql;
  private name: string;

  constructor(mysql: Mysql) {
    this.mysql = mysql;
    this.name = mysql.getMysqlOptions().database;
  }

  /**
   * Drop the current database.
   */
  async dropDatabase(): Promise<void> {
    await this.mysql.rootQuery(`DROP DATABASE IF EXISTS ${this.name}`);
  }

  /**
   * Make sure the database structure (DB, DB USER, TABLES) is configured.
   */
  ensure = async () => await this.mysql.rootQuery(`CREATE DATABASE IF NOT EXISTS ${this.name}; USE ${this.name};`);

  async upgrade() {
    const { MYSQLDBNAME, MYSQLHOST, MYSQLPASS, MYSQLUSER } = getConfig();
    const dbMigrate = DBMigrate.getInstance(true, {
      config: {
        dev: {
          driver: 'mysql',
          database: MYSQLDBNAME,
          host: MYSQLHOST,
          password: MYSQLPASS,
          user: MYSQLUSER,
          multipleStatements: true,
        },
      },
      cwd: isAbsolute(__dirname) ? __dirname : resolve(join('server', __dirname)),
    });
    console.log('Running migrations');
    await dbMigrate.up();
  }
}
