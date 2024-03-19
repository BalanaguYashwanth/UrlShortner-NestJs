## URL shortner NestJs App

 Implemented using typescript + nest.js + mongodb + redis cache


### Main steps covered - 

✅ Built with Nest.js and TypeScript for a robust and efficient backend.

✅ Implemented URL shortening algorithms to optimise storage and retrieval efficiency.

✅ Developed a system to handle URL expirations and auto-deletion after a certain period.

✅  Implemented secure user authentication - signup and signin flows

✅ Each user can only access only to their URLs and associated analytics

✅ Data Management - Mongodb + Redis cache for performance of URL retrieval

✅ Added Advanced Analytics 

- Referral sources

- Time-based click analysis

- Browser and device types

- All these analytics access via analytics api listed in API documentation

#### API output

Here expiration time is not required for every shortUrl - It takes epoch time and optional

```bash
[
    {
        "_id": "65f9c1193d19115b003f3c10",
        "expirationTime": 1710870305
        "shortAlias": "mlpq",
        "shortUrl": "http://localhost:3000/mlpq",
        "userId": "65f9c0133d19115b003f3c0c",
        "url": "https://en.wikipedia.org/wiki/List_of_tz_database_time_zones",
        "createdAt": "2024-03-19T16:45:13.790Z",
        "updatedAt": "2024-03-19T16:48:09.286Z",
        "__v": 0,
        "browserType": {
            "Chrome": 4,
            "Edge": 1,
            "Safari": 1
        },
        "clicks": 6,
        "deviceType": {
            "Desktop": 3,
            "Mobile": 3
        },
        "osType": {
            "Mac": 3,
            "Android": 2,
            "iPhone": 1
        },
        "refType": {
            "direct": 5,
            "email": 1
        },
        "activeHours": [
            {
                "hour": "16:00:00 GMT",
                "clicks": 6
            }
        ]
    }
]
```

✅ Added unit test cases and E2E test cases

## API Documentation

[URLShortner API] (https://documenter.getpostman.com/view/30058115/2sA2xpUAMZ)

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Scalability & Performace optimizations

Deploying into AWS containers with enabled auto scaling groups by specifying min and max instances

Distributed caching using redis

Global Load Balancing to distribute incoming traffic across multiple AWS nodes

AWS Queues to smooth out spikes in traffic by evenly distributing tasks over time & CDNs

Severless (AWS lambda) also one option instead of deploying into contains, but serverless sometimes it faces cold start issues & decrease in overall performance sometimes

Not the least, Metrics helps us to analyse the traffic according to it, we can introduce new implementation for better scalability & performance optimisations