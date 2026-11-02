const jwt = require('jsonwebtoken');

const { handler } = require('../index.js');

const JWT_SECRET = '0HXc4w5NEzA61HkV';

describe('Coupon to secure', () => {

  test('Should return success status for a valid token', async () => {
    const token = jwt.sign({ sub: 'tester1' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 3600 });

    const response = await handler({ headers: { Authorization: `Bearer ${token}` } }, null);
    const responseParsed = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseParsed).toStrictEqual({ status: 'success' });
  });

  test('Should accept a lowercase authorization header', async () => {
    const token = jwt.sign({ sub: 'tester1' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 3600 });

    const response = await handler({ headers: { authorization: `Bearer ${token}` } }, null);

    expect(response.statusCode).toBe(200);
  });

  test('Should return 403 when no authorization header is sent', async () => {
    const response = await handler({ headers: {} }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when the header does not use the Bearer scheme', async () => {
    const token = jwt.sign({ sub: 'tester1' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 3600 });

    const response = await handler({ headers: { Authorization: token } }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when the token signature is invalid', async () => {
    const token = jwt.sign({ sub: 'tester1' }, 'a-different-secret', { algorithm: 'HS256', expiresIn: 3600 });

    const response = await handler({ headers: { Authorization: `Bearer ${token}` } }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when the token is expired', async () => {
    const token = jwt.sign({ sub: 'tester1' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: -10 });

    const response = await handler({ headers: { Authorization: `Bearer ${token}` } }, null);

    expect(response.statusCode).toBe(403);
  });
});
