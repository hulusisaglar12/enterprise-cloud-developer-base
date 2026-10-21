#!/bin/bash

function fail() {
  echo $2
  exit 1
}

echo "Adding provider_id and campaign_id index to coupons table"
awslocal dynamodb update-table \
  --table-name "coupons" \
  --attribute-definitions \
    AttributeName=provider_id,AttributeType=S \
    AttributeName=campaign_id,AttributeType=S \
  --global-secondary-index-updates \
    '[{"Create":{"IndexName":"provider_campaign_index","KeySchema":[{"AttributeName":"provider_id","KeyType":"HASH"},{"AttributeName":"campaign_id","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":25,"WriteCapacityUnits":10}}}]'
[ $? == 0 ] || fail 1 "Failed to add index to coupons table"

echo "provider_campaign_index added to coupons table successfully"
