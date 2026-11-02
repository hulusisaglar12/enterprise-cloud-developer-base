const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const TABLE_NAME = 'users';
const JWT_SECRET = '0HXc4w5NEzA61HkV';
const TOKEN_EXPIRES_IN_SECONDS = 3600;

const INVALID_CREDENTIALS_RESPONSE = {
  statusCode: 403,
  body: JSON.stringify({ message: 'Invalid username or password' })
};

function buildDocumentClient() {
  const options = {};
  if (process.env.LOCALSTACK_HOSTNAME) {
    options.endpoint = `http://${process.env.LOCALSTACK_HOSTNAME}:4566`;
  }
  return new AWS.DynamoDB.DocumentClient(options);
}

function extractCredentials(event) {
  if (event && typeof event.body === 'string') {
    const parsed = JSON.parse(event.body);
    return { username: parsed.username, password: parsed.password };
  }
  return { username: event && event.username, password: event && event.password };
}

exports.handler = async function(event, context) {
  let username;
  let password;

  try {
    ({ username, password } = extractCredentials(event));
  } catch (error) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  if (!username || !password) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  const docClient = buildDocumentClient();

  let user;
  try {
    const result = await docClient.get({
      TableName: TABLE_NAME,
      Key: { username }
    }).promise();
    user = result.Item;
  } catch (error) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  if (!user) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return INVALID_CREDENTIALS_RESPONSE;
  }

  const token = jwt.sign({ sub: username }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: TOKEN_EXPIRES_IN_SECONDS
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      expiresIn: TOKEN_EXPIRES_IN_SECONDS
    })
  };
}
