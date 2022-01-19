require('newrelic');
const express = require('express');
const cors = require('cors');
const { pool, client } = require('../db/index.js');

const DEFAULT_EXPIRATION = 3600;

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get('/loaderio-8d3a5a8657c9d27b70687a0e46b20b0e', (req, res) => {
  res.send('loaderio-8d3a5a8657c9d27b70687a0e46b20b0e');
});

// GET REVIEWS
app.get('/reviews', async (req, res) => {
  const {
    page = 1,
    count = 5,
    product_id = 40345,
    sort = 'newest',
  } = req.query;

  let sortQuery;

  if (sort === 'newest') {
    sortQuery = 'ORDER BY date DESC';
  }

  if (sort === 'helpful') {
    sortQuery = 'ORDER BY helpfulness DESC';
  }

  if (sort === 'relevant') {
    sortQuery = 'ORDER BY helpfulness DESC, date DESC';
  }

  const data = {
    product: String(product_id),
    page,
    count,
    results: [],
  };

  const queryStr = `SELECT r.id AS review_id, r.rating, r.summary, r.recommend, r.response, r.body, TO_TIMESTAMP(r.date / 1000) AS date, r.reviewer_name, r.helpfulness, json_agg(json_build_object('id', p.id, 'url', p.url)) AS photos FROM reviews r JOIN photos p ON p.review_id = r.id WHERE r.product_id = ${product_id} GROUP BY r.id ${sortQuery} LIMIT ${count};`;

  client.get(
    `reviews?product_id=${product_id}&count=${count}&sort=${sort}&page=${page}`,
    async (err, reviews) => {
      if (err) {
        console.error(err);
      }
      if (reviews !== null) {
        console.log('Cache hit');
        return res.json(JSON.parse(reviews));
      } else {
        console.log('Cache miss');
        const allReviews = await pool.query(queryStr);
        data.results.push(...allReviews.rows);
        redisClient.setex(
          `reviews?product_id=${product_id}&count=${count}&sort=${sort}&page=${page}`,
          DEFAULT_EXPIRATION,
          JSON.stringify(data)
        );
        res.header('Content-Type', 'application/json');
        // console.log(JSON.stringify(data, null, 2));
        res.send(JSON.stringify(data, null, 2));
      }
    }
  );

  // try {
  //   const allReviews = await pool.query(queryStr);
  //   data.results.push(...allReviews.rows);
  //   res.header('Content-Type', 'application/json');
  //   console.log(JSON.stringify(data, null, 2));
  //   res.send(JSON.stringify(data, null, 2));
  // } catch (err) {
  //   console.error(err);
  // }
});

// GET REVIEW METADATA
app.get('/reviews/meta', async (req, res) => {
  const { product_id = 40346 } = req.query;

  const queryStr = `SELECT (CAST (reviews.product_id AS TEXT)), json_build_object(
   '1', (SELECT (CAST (count(rating) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND rating = 1),
   '2', (SELECT (CAST (count(rating) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND rating = 2),
   '3', (SELECT (CAST (count(rating) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND rating = 3),
   '4', (SELECT (CAST (count(rating) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND rating = 4),
   '5', (SELECT (CAST (count(rating) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND rating = 5)) AS ratings, json_build_object(
   'false', (SELECT (CAST (count(recommend) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND recommend = false),
   'true', (SELECT (CAST (count(recommend) AS TEXT)) FROM reviews WHERE product_id = ${product_id} AND recommend = true)) AS recommended,
    json_object_agg(characteristics.name, json_build_object('id', characteristics_reviews.id, 'value', (SELECT (CAST (AVG(value) AS TEXT)) FROM characteristics_reviews WHERE characteristics_reviews.characteristic_id = characteristics.id)))
    AS characteristics
  FROM reviews
  LEFT JOIN characteristics ON characteristics.product_id = reviews.product_id
  LEFT JOIN characteristics_reviews ON characteristics_reviews.characteristic_id = characteristics.id
  WHERE reviews.product_id = ${product_id}
  GROUP BY reviews.product_id;`;

  try {
    const allMetaDataReviews = await pool.query(queryStr);
    res.header('Content-Type', 'application/json');
    console.log(JSON.stringify(allMetaDataReviews.rows[0], null, 2));
    res.send(JSON.stringify(allMetaDataReviews.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  }
});

// ADD REVIEW
app.post('/reviews', async (req, res) => {
  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name: reviewer_name,
    email: reviewer_email,
    photos,
    characteristics,
  } = req.body;

  const date = Math.floor(new Date().getTime() / 1000);
  const charIDs = Object.keys(characteristics).map(Number);
  const charValues = Object.values(characteristics);

  const queryArgs = [
    product_id,
    rating,
    date,
    summary,
    body,
    recommend,
    reviewer_name,
    reviewer_email,
    photos,
    charIDs,
    charValues,
  ];

  let queryStr = ``;

  if (photos.length > 0) {
    if (charIDs.length > 0) {
      queryStr = `WITH review_insert AS (
        INSERT INTO reviews(product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
        VALUES( $1, $2, $3, $4, $5, $6, DEFAULT, $7, $8, NULL, DEFAULT )
        RETURNING id
      ),
      photos_insert AS (
        INSERT INTO photos(review_id, url)
        VALUES( (SELECT id FROM review_insert), UNNEST($9::text[]) )
        RETURNING id
      )
      INSERT INTO characteristics_reviews(characteristic_id, review_id, value)
      VALUES( UNNEST($10::int[]), (SELECT id FROM review_insert), UNNEST($11::int[]) )`;
    } else {
      queryStr = `WITH review_insert AS (
        INSERT INTO reviews(product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
        VALUES( $1, $2, $3, $4, $5, $6, DEFAULT, $7, $8, NULL, DEFAULT )
        RETURNING id
      )
      INSERT INTO photos(review_id, url)
      VALUES( (SELECT id FROM review_insert), UNNEST($9::text[]) )
      RETURNING id`;
    }
  } else if (photos.length === 0) {
    if (charIDs.length > 0) {
      queryStr = `WITH review_insert AS (
        INSERT INTO reviews(product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
        VALUES( $1, $2, $3, $4, $5, $6, DEFAULT, $7, $8, NULL, DEFAULT )
        RETURNING id
      ),
      photos_insert AS (
        INSERT INTO photos(review_id, url)
        VALUES( (SELECT id FROM review_insert), $9 )
        RETURNING id
      )
      INSERT INTO characteristics_reviews(characteristic_id, review_id, value)
      VALUES( UNNEST($10::int[]), (SELECT id FROM review_insert), UNNEST($11::int[]) )`;
    } else {
      queryStr = `INSERT INTO reviews(product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) 
      VALUES( $1, $2, $3, $4, $5, $6, DEFAULT, $7, $8, NULL, DEFAULT )`;
    }
  }
  try {
    await pool.query(queryStr, queryArgs);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
  }
});

// MARK REVIEW HELPFUL
app.put('/reviews/:review_id/helpful', async (req, res) => {
  const { review_id } = req.params;

  const queryStr = `UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = ${review_id};`;

  try {
    await pool.query(queryStr);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
  }
});

// REPORT REVIEW
app.put('/reviews/:review_id/report', async (req, res) => {
  const { review_id } = req.params;

  const queryStr = `UPDATE reviews SET reported = true WHERE id = ${review_id};`;
  try {
    await pool.query(queryStr);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
  }
});

const getOrSetCache = (key, cb) => {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (err, data) => {
      if (err) {
        return reject(err);
      }
      if (data !== null) {
        return resolve(JSON.parse(data));
      }
      const freshData = await cb();
      redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
      resolve(freshData);
    });
  });
};

app.listen(port, () => console.log(`Listening on port ${port}!`));
