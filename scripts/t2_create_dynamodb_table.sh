#!/bin/bash

function fail() {
  echo $2
  exit 1
}

# 50 eventually consistent reads/sec at 1KB (0.5 RCU each) = 25 RCU.
# 10 writes/sec at 1KB (1 WCU each) = 10 WCU.
echo "Creating coupons DynamoDB table"
awslocal dynamodb create-table \
  --table-name "coupons" \
  --attribute-definitions AttributeName=coupon_id,AttributeType=S \
  --key-schema AttributeName=coupon_id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=25,WriteCapacityUnits=10
[ $? == 0 ] || fail 1 "Failed to create coupons table"

echo "coupons table created successfully"
