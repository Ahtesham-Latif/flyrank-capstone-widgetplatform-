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
    migrations: {                                                                             
          directory: path.resolve(__dirname, '../../src/migrations')                              
    } 
  }
};

