const express = require('express');
const cors = require('cors');
const pool = require('../db/index.js');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// GET REVIEWS
app.get('/reviews', async (req, res) => {
  const {
    page = 1,
    count = 5,
    product_id = '40344',
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
    product: product_id,
    page,
    count,
    results: [],
  };

  const queryStr = `SELECT r.id AS review_id, r.rating, r.summary, r.recommend, r.response, r.body, TO_TIMESTAMP(r.date / 1000) AS date, r.reviewer_name, r.helpfulness, json_agg(json_build_object('id', p.id, 'url', p.url)) AS photos FROM reviews r JOIN photos p ON p.review_id = r.id WHERE r.product_id = ${product_id} GROUP BY r.id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpfulness ${sortQuery} LIMIT ${count};`;

  try {
    const allReviews = await pool.query(queryStr);
    data.results.push(...allReviews.rows);
    res.header('Content-Type', 'application/json');
    console.log(JSON.stringify(data, null, 2));
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
});
// 232059
// GET REVIEW METADATA
app.get('/reviews/meta', async (req, res) => {
  const { product_id = '40344' } = req.query;

  //   const queryStr = `SELECT product_id, json_build_object(
  // '1', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 1),
  // '2', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 2),
  // '3', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 3),
  // '4', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 4),
  // '5', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 5)) AS ratings, json_build_object(
  // 'false', (SELECT count(recommend) FROM reviews WHERE product_id = ${product_id} AND recommend = false),
  // 'true', (SELECT count(recommend) FROM reviews WHERE product_id = ${product_id} AND recommend = true)) AS recommended, (json_build_object(
  //   'Size', (json_build_object(
  //     'id', 1, 'value', 1)))) AS characteristics, (json_build_object(
  //       'id', 1, 'value', 1)) AS Width, (json_build_object(
  //         'id', 1, 'value', 1)) AS Comfort FROM reviews WHERE product_id = ${product_id} GROUP BY reviews.product_id;`;

  // const queryStr = `SELECT reviews.product_id, characteristics.name, AVG(characteristics_reviews.value) FROM reviews INNER JOIN characteristics ON reviews.product_id = characteristics.product_id INNER JOIN characteristics_reviews ON characteristics.id = characteristics_reviews.characteristic_id WHERE reviews.product_id = 1 GROUP BY characteristics.name, reviews.product_id`;

  const queryStr = `SELECT product_id, json_build_object(
  '1', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 1),
  '2', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 2),
  '3', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 3),
  '4', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 4),
  '5', (SELECT count(rating) FROM reviews WHERE product_id = ${product_id} AND rating = 5)) AS ratings, json_build_object(
  'false', (SELECT count(recommend) FROM reviews WHERE product_id = ${product_id} AND recommend = false),
  'true', (SELECT count(recommend) FROM reviews WHERE product_id = ${product_id} AND recommend = true)) AS recommended, (json_build_object(
    'Size', (json_build_object(
      'id', 1, 'value', 1)))) AS characteristics, (json_build_object(
        'id', 1, 'value', 1)) AS Width, (json_build_object(
          'id', 1, 'value', 1)) AS Comfort FROM reviews WHERE product_id = ${product_id} GROUP BY reviews.product_id;`;

  try {
    const allMetaDataReviews = await pool.query(queryStr);
    res.header('Content-Type', 'application/json');
    console.log(JSON.stringify(allMetaDataReviews.rows, null, 2));
    res.send(JSON.stringify(allMetaDataReviews.rows, null, 2));
    // console.log(JSON.stringify(data, null, 2));
    // res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
});
// GOAL:
// {
//   "product_id": "40344",
//   "ratings": {
//     "1": "17",
//     "2": "17",
//     "3": "50",
//     "4": "63",
//     "5": "171"
//   },
//   "recommended": {
//     "false": "82",
//     "true": "236"
//   },
//   "characteristics": {
//     "Fit": {
//       "id": 135219,
//       "value": "2.8507462686567164"
//     },
//     "Length": {
//       "id": 135220,
//       "value": "2.8283582089552239"
//     },
//     "Comfort": {
//       "id": 135221,
//       "value": "3.1127819548872180"
//     },
//     "Quality": {
//       "id": 135222,
//       "value": "3.2967741935483871"
//     }
//   }
// }

// ADD REVIEW
app.post('/reviews', async (req, res) => {
  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics,
  } = req.body;

  const addReviewQueryStr = `INSERT INTO reviews (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email, helpfulness) VALUES (${product_id}, ${rating}, ${summary}, ${body}, ${recommend}, ${name}, ${email});`;

  const addPhotosQueryStr = `INSERT INTO photos (review_id, url) VALUES (${product_id}, ${photos});`;

  const addCharacteristicsQueryStr = `INSERT INTO characteristics (review_id, id, value) VALUES (${product_id}, ${characteristics});`;
  try {
    const allReviews = await pool.query(addReviewQueryStr);
    console.log('REVIEWS: ', allReviews.rows[0]);
    res.json(allReviews.rows[0]);
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

app.listen(port, () => console.log(`Listening on port ${port}!`));
