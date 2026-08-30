import path from 'path';                                                                             
import { fileURLToPath } from 'url';                                                                 
import dotenv from 'dotenv';                                                                         
                                                                                                         
const __filename = fileURLToPath(import.meta.url);                                                   
const __dirname = path.dirname(__filename);                                                          
                                                                                                         
                                                           
dotenv.config({ path: path.resolve(__dirname, '../../.env') });                                      
                                                                                                         
const isPostgres = Boolean(process.env.DATABASE_URL);                                                
                                                                                                         
const config = {                                                                                                                             
      client: isPostgres ? 'pg' : 'sqlite3',                                                                                                     
      connection: process.env.DATABASE_URL || {                                                                                                  
        filename: path.resolve(__dirname, '../../src/database/app.db')                                                                           
      },                                                                                                                                         
      useNullAsDefault: true,                                                                                                                    
      pool: {                                                                                                                                    
        afterCreate: (conn, cb) => {                                                                                                             
          if (!isPostgres) {                                                                                                                     
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
    };                                                                                                                                           
                                                                                                                                                 
    // Export for BOTH environments                                                                                        
    export default {                                                                                                                             
      development: config,                                                                                                                       
      production: config                                                                                                                         
};