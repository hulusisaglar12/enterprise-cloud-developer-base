#!/bin/bash

API_NAME="coupons"
REGION="us-east-1"
STAGE="local"

function fail() {
  echo $2
  exit 1
}

echo "Retrieving Api id"
API_ID=$(awslocal apigateway get-rest-apis --region ${REGION} --query "items[?name==\`${API_NAME}\`].id" --output text)
[ $? == 0 ] || fail 1 "Failed to retrieve Api id"

if [ -z "$API_ID" ]; then
  echo "Creating REST API"
  awslocal apigateway create-rest-api \
    --region ${REGION} \
    --name "${API_NAME}" \
    --binary-media-types '*/*'
  [ $? == 0 ] || fail 2 "Failed to create Api"

  API_ID=$(awslocal apigateway get-rest-apis --region ${REGION} --query "items[?name==\`${API_NAME}\`].id" --output text)
  [ $? == 0 ] || fail 1 "Failed to retrieve Api id"
fi
echo "Api id ${API_ID}"

echo "Retrieving root resource id"
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/`].id' --output text --region ${REGION})
[ $? == 0 ] || fail 3 "Failed to retrieve root resource id"
echo "Root resource id ${ROOT_RESOURCE_ID}"

echo "Creating coupons_poc resource"
awslocal apigateway create-resource \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --parent-id ${ROOT_RESOURCE_ID} \
    --path-part "coupons_poc"
[ $? == 0 ] || fail 4 "Failed to create resource"

echo "Retrieving coupons_poc resource id"
COUPONS_POC_RESOURCE_ID=$(awslocal apigateway get-resources --region ${REGION} --rest-api-id ${API_ID} --query 'items[?path==`/coupons_poc`].id' --output text)
[ $? == 0 ] || fail 5 "Failed to retrieve resource id"
echo "coupons_poc resource id ${COUPONS_POC_RESOURCE_ID}"

echo "Creating GET method"
awslocal apigateway put-method \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${COUPONS_POC_RESOURCE_ID} \
    --http-method GET \
    --authorization-type "NONE"
[ $? == 0 ] || fail 6 "Failed to create GET method"

echo "Retrieving coupons_list lambda Arn"
COUPONS_LIST_LAMBDA_ARN=$(awslocal lambda list-functions --region ${REGION} --query "Functions[?FunctionName==\`coupons_list\`].FunctionArn" --output text)
[ $? == 0 ] || fail 7 "Failed to retrieve lambda ARN"
echo "coupons_list lambda Arn ${COUPONS_LIST_LAMBDA_ARN}"

echo "Creating integration for coupons_list"
awslocal apigateway put-integration \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --resource-id ${COUPONS_POC_RESOURCE_ID} \
    --http-method GET \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${COUPONS_LIST_LAMBDA_ARN}/invocations \
    --passthrough-behavior WHEN_NO_MATCH
[ $? == 0 ] || fail 8 "Failed to create integration"

echo "Creating deployment"
awslocal apigateway create-deployment \
    --region ${REGION} \
    --rest-api-id ${API_ID} \
    --stage-name ${STAGE}
[ $? == 0 ] || fail 9 "Failed to create deployment"

ENDPOINT="http://${API_ID}.execute-api.localhost.localstack.cloud:4566/${STAGE}/coupons_poc"
echo "API URL: ${ENDPOINT}"
echo "API ID: ${API_ID}"

echo "coupons_poc endpoint provisioned successfully"
