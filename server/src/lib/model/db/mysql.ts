import { getConfig } from '../../../config-helper';
import { getFirstDefined } from '../../utility';
import { Pool, Query } from 'mysql';
import { IConnection } from 'mysql2Types';

// Mysql2 has more or less the same interface as @types/mysql,
// so we will use mysql types here where we can.
const mysql2 = require('mysql2/promise');

export type MysqlOptions = {
  user: string;
  database: string;
  password: string;
  host: string;
  port: number;
  connectTimeout: number;
  multipleStatements: boolean;
  namedPlaceholders: boolean;
};

// Default configuration values, notice we dont have password.
const DEFAULTS: MysqlOptions = {
  user: 'voiceweb',
  database: 'voiceweb',
  password: '',
  host: 'localhost',
  port: 3306,
  connectTimeout: 30000,
  multipleStatements: false,
  namedPlaceholders: true,
};
/**
 * @todo this might lead to runtime errors as common-voice did not check correct typings ;(
 */
export default class Mysql {
  private rootConn: IConnection = null;
  pool: any;
  private poolPromise: Promise<Pool>;
  private static handleError = (err: any) => console.error(`unhandled mysql error ${err.message}`);

  /**
   * Get options from params first, then config, and falling back to defaults.
   *   For configuring, use the following order of priority:
   *     1. options in config.json
   *     2. hard coded DEFAULTS
   */
  getMysqlOptions(): MysqlOptions {
    const config = getConfig();
    return {
      user: getFirstDefined(config.MYSQLUSER, DEFAULTS.user),
      database: getFirstDefined(config.MYSQLDBNAME, DEFAULTS.database),
      password: getFirstDefined(config.MYSQLPASS, DEFAULTS.password),
      host: getFirstDefined(config.MYSQLHOST, DEFAULTS.host),
      port: getFirstDefined(config.MYSQLPORT, DEFAULTS.port),
      connectTimeout: DEFAULTS.connectTimeout,
      multipleStatements: false,
      namedPlaceholders: true,
    };
  }

  createPool = async (): Promise<Pool> => mysql2.createPool(this.getMysqlOptions());

  /**
   * Close all connections to the database.
   */
  endConnection(): void {
    if (this.pool) {
      this.pool.end((e: any) => console.error(e));
      this.pool = null;
    }
    if (this.rootConn) {
      this.rootConn.destroy();
      this.rootConn = null;
    }
  }

  // @ts-ignore TODO this might lead to runtime errors as common-voice did not check correct typings ;(
  query = async (...args: any[]): Promise<any> => (await this.getPool()).query(...args);
  // @ts-ignore TODO this might lead to runtime errors as common-voice did not check correct typings ;(
  escape = async (...args: any[]): Promise<any> => (await this.getPool()).escape(...args);

  async ensureRootConnection(): Promise<void> {
    // Check if we already have the connection we want.
    if (this.rootConn) {
      return;
    }
    // Copy our pre-installed configuration.
    const opts: MysqlOptions = Object.assign({}, this.getMysqlOptions());
    // Do not specify the database name when connecting.
    delete opts.database;
    // Root gets an upgraded connection optimized for schema migration.
    const config = getConfig();
    opts.user = config.MYSQLUSER;
    opts.password = config.MYSQLPASS;
    opts.multipleStatements = true;
    const conn = await this.getConnection(opts);
    conn.on('error', Mysql.handleError.bind(this));
    this.rootConn = conn;
  }

  /**
   * Insert or update query generator.
   */
  async upsert(tableName: string, columns: string[], values: any[]): Promise<void> {
    // Generate our bounded parameters.
    const params = values.map(() => {
      return '?';
    });
    const dupeSql = columns.map((column: string) => {
      return `${column} = ?`;
    });

    // We are using the same values twice in the query.
    const allValues = values.concat(values);

    await this.query(
      `INSERT INTO ${tableName} (${columns.join(',')})
       VALUES (${params.join(',')})
       ON DUPLICATE KEY UPDATE ${dupeSql.join(',')};`,
      allValues
    );
  }

  /**
   * Execute a prepared statement on the root connection.
   */
  async rootExec(sql: string, values?: any[]): Promise<any> {
    values = values || [];
    await this.ensureRootConnection();
    return this.rootConn.execute(sql, values);
  }

  /**
   * Execute a regular query on the root connection.
   */
  async rootQuery(sql: string): Promise<Query> {
    await this.ensureRootConnection();
    return this.rootConn.query(sql);
  }

  private async getPool(): Promise<Pool> {
    if (this.pool) return this.pool;
    return (
      this.poolPromise ||
      (this.poolPromise = new Promise(async resolve => {
        this.pool = await this.createPool();
        resolve(this.pool);
      }))
    );
  }

  private getConnection = async (options: MysqlOptions): Promise<IConnection> => mysql2.createConnection(options);
}
let instance: Mysql;
export const getMySQLInstance = () => instance || (instance = new Mysql());
