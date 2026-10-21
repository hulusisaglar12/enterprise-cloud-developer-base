const AWS = require('aws-sdk');

const TABLE_NAME = 'coupons';

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'coupon_code',
  'campaign_id',
  'provider_id',
  'provider_name',
  'start_date',
  'end_date'
];

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

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request body' })
    };
  }

  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  UPDATABLE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) {
      updateExpressionParts.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = payload[field];
    }
  });

  if (updateExpressionParts.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No valid fields provided for update' })
    };
  }

  const docClient = buildDocumentClient();

  try {
    const result = await docClient.update({
      TableName: TABLE_NAME,
      Key: { coupon_id: id },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update coupon' })
    };
  }
}
