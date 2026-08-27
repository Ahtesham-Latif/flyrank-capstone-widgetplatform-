import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = Boolean(process.env.DATABASE_URL);

export default {
  development: {
    client: isPostgres ? 'pg' : 'sqlite3',
    connection: process.env.DATABASE_URL || {
      filename: path.resolve(__dirname, '../../src/database/app.db')
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        if (!isPostgres) {
          // Enable foreign keys and WAL mode for better concurrency in SQLite
          conn.run('PRAGMA foreign_keys = ON;', () => {
            conn.run('PRAGMA journal_mode = WAL;', cb);
          });
        } else {
          cb();
        }
      }
    },
    migrations: {                                                                             
          directory: path.resolve(__dirname, '../../src/migrations')                              
    } 
  }
};

