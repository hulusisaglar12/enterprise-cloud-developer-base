#!/bin/bash

function fail() {
  echo $2
  exit 1
}

echo "Installing production dependencies for coupons_list"
PROJECT_DIR=$(pwd)
cd ./lambda/coupons_list
npm install --omit=dev
[ $? == 0 ] || fail 1 "Failed to install dependencies"

echo "Creating deployment package for coupons_list function"
rm -f "${PROJECT_DIR}/coupons_list.zip"
zip -r "${PROJECT_DIR}/coupons_list.zip" index.js package.json node_modules
cd "$PROJECT_DIR"
[ $? == 0 ] || fail 2 "Failed to create deployment package"

echo "Creating coupons_list function"
awslocal lambda create-function \
    --function-name "coupons_list" \
    --runtime "nodejs14.x" \
    --zip-file fileb://coupons_list.zip \
    --handler "index.handler" \
    --role "arn:aws:iam::000000000000:role/coupons_lambda_role"
[ $? == 0 ] || fail 3 "Failed to create function"
echo "coupons_list function created successfully"
