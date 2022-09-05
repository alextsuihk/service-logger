import mongoose from 'mongoose';
import request from 'supertest';

// custom modules
import app from '../app';
import config from '../config';
import serviceLoader, { Service } from '../service-loader';

describe('Log API Routes', () => {
  const { apiKeyAdmin } = config;
  let services: Service[];

  const expectedFormat = {
    _id: expect.any(String),
    tenant: expect.any(String),
    level: expect.any(String),
    ip: expect.any(String),
    // userAgent: expect.any(String), // null in case of JEST
    // mobileDetect: expect.anything(), // null un case of JEST
    msg: expect.any(String),
    extra: expect.anything(),
    createdAt: expect.any(String),
  };

  beforeAll(async () => {
    await serviceLoader.update();
    services = serviceLoader.load();
  });
  afterAll(() => mongoose.connection.close());
  // afterAll(done => mongoose.disconnect(done));

  test('should return an id when POST a log with regular x-api-key', async () => {
    expect.assertions(3);

    const { apiKey } = services[0].write;
    const res = await request(app)
      .post('/api/logs')
      .send({
        instance: 'Some Hash code',
        level: 'Jest-Level',
        msg: 'Jest Message',
        extra: { name: 'Alex', alias: 'The Great' },
      })
      .set({ 'x-api-key': apiKey });
    expect(res.status).toBe(201);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Success', id: expect.any(String) });
  });

  test('should fail when POST a log with admin x-api-key, but without tenantQS', async () => {
    expect.assertions(3);

    const res = await request(app)
      .post('/api/logs')
      .send({ level: 'Jest-Level', msg: 'Jest Message', extra: { a: 11, b: 22 } })
      .set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Invalid Domain' });
  });

  test('should fail when POST a log without valid x-api-key', async () => {
    expect.assertions(6);

    // POST without API Key
    let res = await request(app).post('/api/logs');
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });

    // POST with invalid API Key
    res = await request(app).post('/api/logs').set({ 'x-api-key': 'Invalid API Key' });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });
  });

  test('should fail when GET a list of log as admin WITHOUT tenant in querystring', async () => {
    expect.assertions(6);

    // without querystring
    let res = await request(app).get('/api/logs').set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Invalid Domain' });

    // without valid tenant querystring
    res = await request(app).get('/api/logs?tenant=INVALID').set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Invalid Domain' });
  });

  test('should report a list of log when GET as admin with valid tenant querystring', async () => {
    expect.assertions(3);

    const [{ tenant }] = services;
    const res = await request(app).get(`/api/logs?tenant=${tenant}`).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ logs: expect.arrayContaining([expect.objectContaining(expectedFormat)]) });
  });

  test('should report a list of log when GET with normal x-api-key', async () => {
    expect.assertions(3);

    const { apiKey } = services[0].read;
    const res = await request(app).get(`/api/logs`).set({ 'x-api-key': apiKey });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ logs: expect.arrayContaining([expect.objectContaining(expectedFormat)]) });
  });
});
