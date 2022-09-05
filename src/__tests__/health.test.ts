import mongoose from 'mongoose';
import request from 'supertest';

// custom modules
import app from '../app';
import config from '../config';
import serviceLoader, { Service } from '../service-loader';

describe('Health API Routes', () => {
  const { apiKeyAdmin } = config;
  let services: Service[];

  const expectedFormat = {
    tenant: expect.any(String),
    lastLogCreatedAt: expect.any(String),
    startTime: expect.any(String),
    appUpTime: expect.any(Number),
    nodeUpTime: expect.any(Number),
    memoryUsage: {
      arrayBuffers: expect.any(Number),
      external: expect.any(Number),
      heapTotal: expect.any(Number),
      heapUsed: expect.any(Number),
      rss: expect.any(Number),
    },
    freemem: expect.any(Number),
  };

  beforeAll(async () => {
    await serviceLoader.update();
    services = serviceLoader.load();
  });
  afterAll(() => mongoose.connection.close());
  // afterAll(done => mongoose.disconnect(done));

  test('should report a list of log when GET with regular API-Key', async () => {
    expect.assertions(3);

    const services = serviceLoader.load();
    const { apiKey } = services[0].read;

    const res = await request(app).get('/api/health/').set({ 'x-api-key': apiKey });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual(expectedFormat);
  });

  test('should report a list of log when GET as admin with valid tenant querystring', async () => {
    expect.assertions(3);

    // with valid tenant querystring
    const [{ tenant }] = services;
    const res = await request(app).get(`/api/health?tenant=${tenant}`).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual(expectedFormat);
  });

  test('should fail when GET as admin WITHOUT valid tenant querystring', async () => {
    expect.assertions(6);

    // without querystring
    let res = await request(app).get(`/api/health`).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Invalid Domain' });

    // without valid tenant querystring
    res = await request(app).get(`/api/health?tenant=INVALID`).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Invalid Domain' });
  });

  test('should fail when GET log without a valid api-key', async () => {
    expect.assertions(6);

    // without API key header
    let res = await request(app).get('/api/health/');
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });

    // invalid API key
    res = await request(app).get('/api/health/').set({ 'x-api-key': 'INVALID-API' });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });
  });
});
