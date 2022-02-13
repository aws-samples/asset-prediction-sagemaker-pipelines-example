#!/bin/bash

NAMESPACE=apspe
PROFILE=apspe
REGION=ap-southeast-1
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --region $REGION --output json | jq .Account --raw-output)

BUCKET=$NAMESPACE-website-$ACCOUNT_ID-$REGION
aws s3 cp s3://${BUCKET}/static/appvars.js ../website/public/static/ --profile $PROFILE --region $REGION