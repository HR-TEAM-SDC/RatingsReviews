CREATE DATABASE SDC;

DROP TABLE IF EXISTS reviews, photos, characteristics, characteristics_reviews;

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INT,
    rating INT,
    date BIGINT,
    summary VARCHAR (500),
    body VARCHAR (500),
    recommend BOOLEAN DEFAULT FALSE,
    reported BOOLEAN DEFAULT FALSE,
    reviewer_name VARCHAR (50),
    reviewer_email VARCHAR (50),
    response VARCHAR (500),
    helpfulness INT DEFAULT 0
);

COPY reviews(id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) 
FROM '/private/tmp/reviews.csv' 
DELIMITER ',' 
NULL AS 'null' 
CSV HEADER;

/* COPY reviews(id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) FROM '/private/tmp/test_reviews.csv' DELIMITER ',' CSV HEADER; */

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    review_id INT,
    url VARCHAR,
    FOREIGN KEY(review_id) REFERENCES reviews(id)
);

COPY photos(id, review_id, url) 
FROM '/private/tmp/reviews_photos.csv' 
DELIMITER ',' 
NULL AS 'null' 
CSV HEADER;

/* COPY photos(id, review_id, url) FROM '/private/tmp/test_reviews_photos.csv' DELIMITER ',' CSV HEADER; */

CREATE TABLE characteristics (
    id SERIAL PRIMARY KEY,
    product_id INT,
    name VARCHAR (50)
);

COPY characteristics(id, product_id, name) 
FROM '/private/tmp/characteristics.csv' 
DELIMITER ',' 
NULL AS 'null' 
CSV HEADER;

/* COPY characteristics(id, product_id, name) FROM '/private/tmp/test_characteristics.csv' DELIMITER ',' CSV HEADER; */

CREATE TABLE characteristics_reviews (
    id SERIAL PRIMARY KEY,
    characteristic_id INT,
    review_id INT,
    value INT,
    FOREIGN KEY(characteristic_id) REFERENCES characteristics(id),
    FOREIGN KEY(review_id) REFERENCES reviews(id)
);

COPY characteristics_reviews(id, characteristic_id, review_id, value) 
FROM '/private/tmp/characteristic_reviews.csv' 
DELIMITER ',' 
NULL AS 'null' 
CSV HEADER;

/* COPY characteristics_reviews(id, characteristic_id, review_id, value) FROM '/private/tmp/test_characteristics_reviews.csv' DELIMITER ',' CSV HEADER; */

CREATE INDEX reviews_product_id_index ON reviews(product_id);
CREATE INDEX reviews_rating_index ON reviews(rating);
CREATE INDEX reviews_recommend_index ON reviews(recommend);
CREATE INDEX reviews_date_index ON reviews(date);
CREATE INDEX reviews_helpfulness_index ON reviews(helpfulness);
CREATE INDEX photos_review_id_index ON photos(review_id);
CREATE INDEX chars_id_index ON characteristics(id);
CREATE INDEX chars_product_id_index ON characteristics(product_id);
CREATE INDEX chars_reviews_char_id_index ON characteristics_reviews(characteristic_id);
CREATE INDEX chars_reviews_value_index ON characteristics_reviews(value);