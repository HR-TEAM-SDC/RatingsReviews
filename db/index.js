const { Pool } = require('pg');
const { createClient } = require('redis');

const client = createClient();
// const client = createClient({ url: 'http://54.153.125.69' });

client.connect();

client.on('connect', () => console.log('Redis connected'));
client.on('error', error => console.log('Redis Error', error));

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'sdc',
});

// const pool = new Pool({
//   user: 'postgres',
//   password: 'password',
//   host: '54.215.135.233',
//   port: 5432,
//   database: 'sdc',
// });

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = { pool, client };
