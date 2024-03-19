import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ShortnerModule } from '../shortner.module';

describe('ShortnerController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ShortnerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST /shorten (Create Short URL)', async () => {
    const createShortUrlDto = { url: 'https://example.com' };
    const response = await request(app.getHttpServer())
      .post('/shorten')
      .send(createShortUrlDto)
      .expect(201);

    expect(response.body).toHaveProperty('shortUrl');
    expect(response.body.shortUrl).toMatch(/http:\/\/localhost:3000\/\w+/);
  });

  it('/GET /:shortAlias (Redirect Short URL)', async () => {
    const createShortUrlDto = { url: 'https://example.com' };
    const response = await request(app.getHttpServer())
      .post('/shorten')
      .send(createShortUrlDto)
      .expect(201);

    const shortUrl = response.body.shortUrl;

    await request(app.getHttpServer())
      .get(shortUrl.substr('http://localhost:3000'.length))
      .expect(302)
      .expect('Location', 'https://example.com');
  });
});
