const AWS = require('aws-sdk');

const TABLE_NAME = 'coupons';

function buildDocumentClient() {
  const options = {};
  if (process.env.LOCALSTACK_HOSTNAME) {
    options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:4566`;
  }
  return new AWS.DynamoDB.DocumentClient(options);
}

exports.handler = async function(event, context) {
  const id = event.pathParameters && event.pathParameters.id;

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing coupon id path parameter' })
    };
  }

  const docClient = buildDocumentClient();

  try {
    const result = await docClient.get({
      TableName: TABLE_NAME,
      Key: { coupon_id: id }
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Coupon not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to retrieve coupon' })
    };
  }
}
