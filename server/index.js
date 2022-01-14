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

  const result = {
    product: product_id,
    page,
    count,
    results: [],
  };

  const queryStr = `SELECT r.id AS review_id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpfulness, json_agg(json_build_object('id', p.id, 'url', p.url)) AS photos FROM reviews r JOIN photos p ON p.review_id = r.id WHERE r.product_id = ${product_id} GROUP BY r.id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpfulness ${sortQuery} LIMIT 5;`;

  try {
    const allReviews = await pool.query(queryStr);
    result.results.push(...allReviews.rows);
    for (let resultsObj of result.results) {
      resultsObj.date = new Date(Number(resultsObj.date)).toISOString();
    }
    res.header('Content-Type', 'application/json');
    console.log(JSON.stringify(result, null, 2));
    res.send(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
});

// DB:
// [
//   {
//     id: 3406819,
//     product_id: 589834,
//     rating: 4,
//     date: '1616507071762',
//     summary:
//       'Optio distinctio non voluptatem aut consequatur dolore quibusdam.',
//     body: 'Ab omnis rerum rerum. Tenetur sint pariatur excepturi ut architecto autem commodi nihil. Voluptatibus neque sint voluptatem minima ut amet sequi. Laudantium quis necessitatibus nihil aliquid repudiandae eum sit. Consequuntur in at.',
//     recommend: true,
//     reported: false,
//     reviewer_name: 'Irwin_Marvin94',
//     reviewer_email: 'Harrison21@yahoo.com',
//     response: 'null',
//     helpfulness: 2,
//   },
// ];

// GOAL:
// {
//   "product": "2",
//   "page": 0,
//   "count": 5,
//   "results": [
//     {
//       "review_id": 5,
//       "rating": 3,
//       "summary": "I'm enjoying wearing these shades",
//       "recommend": false,
//       "response": null,
//       "body": "Comfortable and practical.",
//       "date": "2019-04-14T00:00:00.000Z",
//       "reviewer_name": "shortandsweeet",
//       "helpfulness": 5,
//       "photos": [{
//           "id": 1,
//           "url": "urlplaceholder/review_5_photo_number_1.jpg"
//         },
//         {
//           "id": 2,
//           "url": "urlplaceholder/review_5_photo_number_2.jpg"
//         },
//       ]
//     },
//     {
//       "review_id": 3,
//       "rating": 4,
//       "summary": "I am liking these glasses",
//       "recommend": false,
//       "response": "Glad you're enjoying the product!",
//       "body": "They are very dark. But that's good because I'm in very sunny spots",
//       "date": "2019-06-23T00:00:00.000Z",
//       "reviewer_name": "bigbrotherbenjamin",
//       "helpfulness": 5,
//       "photos": [],
//     },
//   ]
// }

// GET REVIEW METADATA
app.get('/reviews/meta', async (req, res) => {
  const { product_id } = req.query;
  try {
    const allReviews = await pool.query('SELECT * FROM reviews;');
    console.log('REVIEWS: ', allReviews.rows[0]);
    res.json(allReviews.rows[0]);
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
    name,
    email,
    photos,
    characteristics,
  } = req.query;
  try {
    const allReviews = await pool.query('SELECT * FROM reviews;');
    console.log('REVIEWS: ', allReviews.rows[0]);
    res.json(allReviews.rows[0]);
  } catch (err) {
    console.error(err);
  }
});

// MARK REVIEW HELPFUL
app.put('/reviews/:review_id/helpful', async (req, res) => {
  const { review_id } = req.query;
  try {
    const allReviews = await pool.query('SELECT * FROM reviews;');
    console.log('REVIEWS: ', allReviews.rows[0]);
    res.json(allReviews.rows[0]);
  } catch (err) {
    console.error(err);
  }
});

// REPORT REVIEW
app.put('/reviews/:review_id/report', async (req, res) => {
  const { review_id } = req.query;
  try {
    const allReviews = await pool.query('SELECT * FROM reviews;');
    console.log('REVIEWS: ', allReviews.rows[0]);
    res.json(allReviews.rows[0]);
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

// new Date(1619059182968).toISOString();
