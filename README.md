# RatingsReviews
RatingsReviews API is a micro-service architecture system that is split up from a monolithic backend to support scalability with demands of production traffic. This repo was deployed on an AWS:EC2 free-tier instance and connected to a PostgreSQL remote database.

# Set Up
This repo is meant for connecting the front-end application to a database.

Once repo has been forked down:
`npm run install`

Starting server for development:
`npm run start`

If API is deployed, use pm2 to keep server running:
`npm run pm2:start`

To stop pm2 server:
`npm run pm2:stop`

![NODEJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![EXPRESS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![POSTGRESQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![REDIS](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)
