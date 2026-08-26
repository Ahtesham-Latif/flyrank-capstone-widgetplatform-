import knex from 'knex';
import knexConfig from './knexfile.js';

const db = knex(knexConfig.development);

export default db;

// console.log("DB.js");