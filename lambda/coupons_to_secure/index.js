const jwt = require('jsonwebtoken');

const JWT_SECRET = '0HXc4w5NEzA61HkV';

const INVALID_TOKEN_RESPONSE = {
  statusCode: 403,
  body: JSON.stringify({ message: 'Missing or invalid token' })
};

function extractToken(event) {
  const headers = (event && event.headers) || {};
  const authHeader = headers.Authorization || headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

exports.handler = async function(event, context) {
  const token = extractToken(event);

  if (!token) {
    return INVALID_TOKEN_RESPONSE;
  }

  try {
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return INVALID_TOKEN_RESPONSE;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'success'
    })
  };
}
