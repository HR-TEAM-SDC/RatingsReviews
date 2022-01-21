const { Pool } = require('pg');
const { createClient } = require('redis');

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
//   host: '54.176.58.50',
//   port: 5432,
//   database: 'sdc',
// });

pool
  .connect()
  .then(() => {
    console.log('Connected to Postgress');
  })
  .catch(err => {
    console.log(err);
  });

const client = createClient();

client.connect();

client.on('connect', () => console.log('Redis connected'));
client.on('error', error => console.log('Redis Error', error));

module.exports = { pool, client };
