#!/bin/bash

API_NAME="coupons"
REGION="us-east-1"
STAGE="local"
ROLE_ARN="arn:aws:iam::000000000000:role/coupons_lambda_role"

function fail() {
  echo $2
  exit 1
}

echo "Installing production dependencies for coupons_to_secure"
PROJECT_DIR=$(pwd)
cd ./lambda/coupons_to_secure
npm install --omit=dev
[ $? == 0 ] || fail 1 "Failed to install dependencies"

echo "Creating deployment package for coupons_to_secure function"
rm -f "${PROJECT_DIR}/coupons_to_secure.zip"
zip -r "${PROJECT_DIR}/coupons_to_secure.zip" index.js package.json node_modules
cd "$PROJECT_DIR"
[ $? == 0 ] || fail 2 "Failed to create deployment package"

echo "Checking for an existing coupons_to_secure function"
EXISTING_FUNCTION=$(awslocal lambda list-functions --region ${REGION} --query "Functions[?FunctionName==\`coupons_to_secure\`].FunctionName" --output text)
[ $? == 0 ] || fail 3 "Failed to check for existing function"

if [ -z "$EXISTING_FUNCTION" ]; then
  echo "Creating coupons_to_secure function"
  awslocal lambda create-function \
      --function-name "coupons_to_secure" \
      --runtime "nodejs14.x" \
      --zip-file fileb://coupons_to_secure.zip \
      --handler "index.handler" \
      --role "${ROLE_ARN}"
  [ $? == 0 ] || fail 4 "Failed to create function"
else
  echo "Updating coupons_to_secure function code"
  awslocal lambda update-function-code \
      --function-name "coupons_to_secure" \
      --zip-file fileb://coupons_to_secure.zip
  [ $? == 0 ] || fail 4 "Failed to update function code"

  echo "Updating coupons_to_secure function role"
  awslocal lambda update-function-configuration \
      --function-name "coupons_to_secure" \
      --role "${ROLE_ARN}"
  [ $? == 0 ] || fail 5 "Failed to update function role"
fi
echo "coupons_to_secure function deployed successfully"

echo "Retrieving Api id"
API_ID=$(awslocal apigateway get-rest-apis --region ${REGION} --query "items[?name==\`${API_NAME}\`].id" --output text)
[ $? == 0 ] || fail 6 "Failed to retrieve Api id"

if [ -z "$API_ID" ]; then
  echo "Creating REST API"
  awslocal apigateway create-rest-api \
    --region ${REGION} \
    --name "${API_NAME}" \
    --binary-media-types '*/*'
  [ $? == 0 ] || fail 7 "Failed to create Api"

  API_ID=$(awslocal apigateway get-rest-apis --region ${REGION} --query "items[?name==\`${API_NAME}\`].id" --output text)
  [ $? == 0 ] || fail 6 "Failed to retrieve Api id"
fi
echo "Api id ${API_ID}"

echo "Retrieving root resource id"
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/`].id' --output text --region ${REGION})
[ $? == 0 ] || fail 8 "Failed to retrieve root resource id"

echo "Checking for existing /coupons resource"
COUPONS_RESOURCE_ID=$(awslocal apigateway get-resources --region ${REGION} --rest-api-id ${API_ID} --query 'items[?path==`/coupons`].id' --output text)
[ $? == 0 ] || fail 9 "Failed to check for /coupons resource"

if [ -z "$COUPONS_RESOURCE_ID" ]; then
  echo "Creating /coupons resource"
  awslocal apigateway create-resource \
      --region ${REGION} \
      --rest-api-id ${API_ID} \
      --parent-id ${ROOT_RESOURCE_ID} \
      --path-part "coupons"
  [ $? == 0 ] || fail 10 "Failed to create /coupons resource"

  COUPONS_RESOURCE_ID=$(awslocal apigateway get-resources --region ${REGION} --rest-api-id ${API_ID} --query 'items[?path==`/coupons`].id' --output text)
  [ $? == 0 ] || fail 9 "Failed to retrieve /coupons resource id"
fi
echo "/coupons resource id ${COUPONS_RESOURCE_ID}"

echo "Checking for existing /coupons/to_secure resource"
COUPONS_TO_SECURE_RESOURCE_ID=$(awslocal apigateway get-resources --region ${REGION} --rest-api-id ${API_ID} --query 'items[?path==`/coupons/to_secure`].id' --output text)
[ $? == 0 ] || fail 11 "Failed to check for /coupons/to_secure resource"

if [ -z "$COUPONS_TO_SECURE_RESOURCE_ID" ]; then
  echo "Creating /coupons/to_secure resource"
  awslocal apigateway create-resource \
      --region ${REGION} \
      --rest-api-id ${API_ID} \
      --parent-id ${COUPONS_RESOURCE_ID} \
      --path-part "to_secure"
  [ $? == 0 ] || fail 12 "Failed to create /coupons/to_secure resource"

  COUPONS_TO_SECURE_RESOURCE_ID=$(awslocal apigateway get-resources --region ${REGION} --rest-api-id ${API_ID} --query 'items[?path==`/coupons/to_secure`].id' --output text)
  [ $? == 0 ] || fail 11 "Failed to retrieve /coupons/to_secure resource id"
fi
echo "/coupons/to_secure resource id ${COUPONS_TO_SECURE_RESOURCE_ID}"

echo "Checking for existing GET method on /coupons/to_secure"
awslocal apigateway get-method \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${COUPONS_TO_SECURE_RESOURCE_ID} \
    --http-method GET > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Creating GET method on /coupons/to_secure"
  awslocal apigateway put-method \
      --region ${REGION} \
      --rest-api-id ${API_ID} \
      --resource-id ${COUPONS_TO_SECURE_RESOURCE_ID} \
      --http-method GET \
      --authorization-type "NONE"
  [ $? == 0 ] || fail 13 "Failed to create GET method"
fi

echo "Retrieving coupons_to_secure lambda Arn"
COUPONS_TO_SECURE_LAMBDA_ARN=$(awslocal lambda list-functions --region ${REGION} --query "Functions[?FunctionName==\`coupons_to_secure\`].FunctionArn" --output text)
[ $? == 0 ] || fail 14 "Failed to retrieve lambda ARN"

echo "Creating integration for coupons_to_secure"
awslocal apigateway put-integration \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${COUPONS_TO_SECURE_RESOURCE_ID} \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${COUPONS_TO_SECURE_LAMBDA_ARN}/invocations \
    --passthrough-behavior WHEN_NO_MATCH
[ $? == 0 ] || fail 15 "Failed to create integration"

echo "Creating deployment"
awslocal apigateway create-deployment \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --stage-name ${STAGE}
[ $? == 0 ] || fail 16 "Failed to create deployment"

echo "GET /coupons/to_secure endpoint deployed successfully"
