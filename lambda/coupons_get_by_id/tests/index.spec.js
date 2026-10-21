const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');

AWSMock.setSDKInstance(AWS);

const { handler } = require('../index.js');

describe('Coupon get by id', () => {

  afterEach(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('Should return 400 when the id path parameter is missing', async () => {
    const response = await handler({ pathParameters: null }, null);

    expect(response.statusCode).toBe(400);
  });

  test('Should return the coupon when it is found', async () => {
    const sampleCoupon = {
      coupon_id: '319326de971100158f6fa0daeec978fba1f17e4b',
      title: 'Save 20% on Fairmont hotels'
    };

    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      expect(params.TableName).toBe('coupons');
      expect(params.Key).toStrictEqual({ coupon_id: sampleCoupon.coupon_id });
      callback(null, { Item: sampleCoupon });
    });

    const response = await handler({ pathParameters: { id: sampleCoupon.coupon_id } }, null);
    const responseParsed = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseParsed).toStrictEqual(sampleCoupon);
  });

  test('Should return 404 when the coupon does not exist', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, {});
    });

    const response = await handler({ pathParameters: { id: 'missing-id' } }, null);

    expect(response.statusCode).toBe(404);
  });

  test('Should return 500 when the database call fails', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(new Error('connection error'), null);
    });

    const response = await handler({ pathParameters: { id: 'any-id' } }, null);

    expect(response.statusCode).toBe(500);
  });
});
