const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');

AWSMock.setSDKInstance(AWS);

const { handler } = require('../index.js');

describe('Coupon update', () => {

  afterEach(() => {
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  test('Should return 400 when the id path parameter is missing', async () => {
    const response = await handler({ pathParameters: null, body: '{}' }, null);

    expect(response.statusCode).toBe(400);
  });

  test('Should return 400 when the request body is not valid JSON', async () => {
    const response = await handler({ pathParameters: { id: 'any-id' }, body: 'not json' }, null);

    expect(response.statusCode).toBe(400);
  });

  test('Should return 400 when no updatable fields are provided', async () => {
    const response = await handler({ pathParameters: { id: 'any-id' }, body: JSON.stringify({ unknown_field: 'value' }) }, null);

    expect(response.statusCode).toBe(400);
  });

  test('Should update the coupon and return the updated item', async () => {
    const couponId = '319326de971100158f6fa0daeec978fba1f17e4b';
    const updatedCoupon = {
      coupon_id: couponId,
      title: 'Save 30% on Fairmont hotels'
    };

    AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
      expect(params.TableName).toBe('coupons');
      expect(params.Key).toStrictEqual({ coupon_id: couponId });
      expect(params.ExpressionAttributeValues[':title']).toBe('Save 30% on Fairmont hotels');
      callback(null, { Attributes: updatedCoupon });
    });

    const response = await handler({
      pathParameters: { id: couponId },
      body: JSON.stringify({ title: 'Save 30% on Fairmont hotels' })
    }, null);
    const responseParsed = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(responseParsed).toStrictEqual(updatedCoupon);
  });

  test('Should return 500 when the database call fails', async () => {
    AWSMock.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
      callback(new Error('connection error'), null);
    });

    const response = await handler({
      pathParameters: { id: 'any-id' },
      body: JSON.stringify({ title: 'New title' })
    }, null);

    expect(response.statusCode).toBe(500);
  });
});
