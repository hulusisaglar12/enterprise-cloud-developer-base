#!/bin/bash

function fail() {
  echo $2
  exit 1
}

echo "Creating coupons_lambda_policy"
awslocal iam create-policy \
  --policy-name "coupons_lambda_policy" \
  --policy-document file://scripts/coupons_lambda_policy.json
[ $? == 0 ] || fail 1 "Failed to create coupons_lambda_policy"

echo "Creating coupons_lambda_role"
awslocal iam create-role \
  --role-name "coupons_lambda_role" \
  --assume-role-policy-document \
  file://scripts/coupons_lambda_role_assume_role_policy.json
[ $? == 0 ] || fail 2 "Failed to create coupons_lambda_role"

echo "Attaching coupons_lambda_policy to coupons_lambda_role"
awslocal iam attach-role-policy \
  --role-name "coupons_lambda_role" \
  --policy-arn "arn:aws:iam::000000000000:policy/coupons_lambda_policy"
[ $? == 0 ] || fail 3 "Failed to attach policy to role"

echo "coupons_lambda_role provisioned successfully"
