import mongoose from 'mongoose';
import request from 'supertest';

// custom modules
import app from '../app';
import config from '../config';
import serviceLoader from '../service-loader';

describe('Service API Routes', () => {
  const { apiKeyAdmin } = config;
  let created: string;

  const expectedFormat = {
    _id: expect.any(String),
    tenant: expect.any(String),
    read: {
      apiKey: expect.any(String),
      ips: expect.arrayContaining([expect.any(String)]),
    },
    write: {
      apiKey: expect.any(String),
      ips: expect.arrayContaining([expect.any(String)]),
    },
    mailTo: expect.any(String),
  };

  const tenant = `Jest-${Math.random()}`;
  const data = {
    tenant,
    read: { apiKey: `read-key-${Math.random()}`, ips: ['1.2.3.4'] },
    write: { apiKey: `write-key-${Math.random()}`, ips: ['1.2.3.4'] },
    mailTo: 'fake@@email.com',
  };

  beforeAll(() => serviceLoader.update());
  afterAll(() => mongoose.connection.close());
  // afterAll(done => mongoose.disconnect(done));

  test('should fail when GET without admin x-api-key', async () => {
    expect.assertions(6);

    // get without x-api-key
    let res = await request(app).get('/api/services');
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });

    // get with INVALID x-api-key
    res = await request(app).get('/api/services').set({ 'x-api-key': 'INVALID-KEY' });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });
  });

  test('should return an array when GET with admin x-api-key', async () => {
    expect.assertions(3);

    const res = await request(app).get('/api/services').set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ services: expect.arrayContaining([expect.objectContaining(expectedFormat)]) });

    created = res.body.tenant;
  });

  test('should fail when add a new tenant without admin x-api-key', async () => {
    expect.assertions(6);

    // post without x-api-key
    let res = await request(app).post('/api/services').send(data);
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });

    // post with INVALID x-api-key
    res = await request(app).post('/api/services').send(data).set({ 'x-api-key': 'INVALID-KEY' });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });
  });

  test('should fail when add MALFORMED tenant with admin x-api-key', async () => {
    expect.assertions(3);
    const res = await request(app).post('/api/services').send({ tenant: '' }).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(422);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Malformed Data' });
  });

  test('should return an id when add a new tenant with admin x-api-key', async () => {
    expect.assertions(3);

    const res = await request(app).post('/api/services').send(data).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(201);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Success', tenant });

    created = res.body.tenant;
  });

  test('should fail when add an existing tenant with admin x-api-key', async () => {
    expect.assertions(3);
    const res = await request(app).post('/api/services').send(data).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(400);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Domain already exists' });
  });

  test('should fail when remove a newly created tenant without admin x-api-key', async () => {
    expect.assertions(6);

    // post without x-api-key
    let res = await request(app).delete(`/api/services/${created}`);
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });

    // post with INVALID x-api-key
    res = await request(app).delete(`/api/services/${created}`).set({ 'x-api-key': 'INVALID-KEY' });
    expect(res.status).toBe(401);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Access Denied' });
  });

  test('should return an id when remove a newly created tenant with admin x-api-key', async () => {
    expect.assertions(3);

    const res = await request(app).delete(`/api/services/${created}`).set({ 'x-api-key': apiKeyAdmin });
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body).toEqual({ message: 'Success', tenant });
  });
});
