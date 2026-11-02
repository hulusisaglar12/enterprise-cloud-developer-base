const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

AWSMock.setSDKInstance(AWS);

const { handler } = require('../index.js');

const JWT_SECRET = '0HXc4w5NEzA61HkV';
const PLAIN_PASSWORD = 'Pc4RM0AMKy5aSGfD';
const HASHED_PASSWORD = bcrypt.hashSync(PLAIN_PASSWORD, 12);

describe('Coupon get token', () => {

  afterEach(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('Should return a signed token for valid credentials', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      expect(params.TableName).toBe('users');
      expect(params.Key).toStrictEqual({ username: 'tester1' });
      callback(null, { Item: { username: 'tester1', password: HASHED_PASSWORD } });
    });

    const response = await handler({ body: JSON.stringify({ username: 'tester1', password: PLAIN_PASSWORD }) }, null);
    const responseParsed = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseParsed.expiresIn).toBe(3600);

    const decoded = jwt.verify(responseParsed.token, JWT_SECRET);
    expect(decoded.sub).toBe('tester1');
  });

  test('Should accept credentials passed directly on the event', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, { Item: { username: 'tester1', password: HASHED_PASSWORD } });
    });

    const response = await handler({ username: 'tester1', password: PLAIN_PASSWORD }, null);

    expect(response.statusCode).toBe(200);
  });

  test('Should return 403 when the password is incorrect', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, { Item: { username: 'tester1', password: HASHED_PASSWORD } });
    });

    const response = await handler({ body: JSON.stringify({ username: 'tester1', password: 'wrong-password' }) }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when the username does not exist', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, {});
    });

    const response = await handler({ body: JSON.stringify({ username: 'unknown', password: PLAIN_PASSWORD }) }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when username or password are missing', async () => {
    const response = await handler({ body: JSON.stringify({ username: 'tester1' }) }, null);

    expect(response.statusCode).toBe(403);
  });

  test('Should return 403 when the request body is not valid JSON', async () => {
    const response = await handler({ body: 'not json' }, null);

    expect(response.statusCode).toBe(403);
  });
});
