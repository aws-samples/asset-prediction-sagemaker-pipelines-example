#!/bin/bash

set -e

if [[ -z "${DEPLOYMENT_PROFILE}" ]]; then
    PROFILE=apspe
else
    PROFILE="${DEPLOYMENT_PROFILE}"
fi

if [[ -z "${DEPLOYMENT_REGION}" ]]; then
    REGION=ap-southeast-1
else
    REGION="${DEPLOYMENT_REGION}"
fi

if [[ -z "${DEPLOYMENT_NAMESPACE}" ]]; then
    NAMESPACE=apspe
else
    NAMESPACE="${DEPLOYMENT_NAMESPACE}"
fi

REPO_BASEURL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
DOCKERFILE=Dockerfile-processing
PUSH_TO_ECR=1
IMAGE="${NAMESPACE}-prediction-processing"

# If the repository doesn't exist in ECR, create it.
echo "Checking if repo '$IMAGE' exists"
((PUSH_TO_ECR)) && aws ecr describe-repositories --repository-names "$IMAGE" --profile $PROFILE --region $REGION > /dev/null 2>&1
if [ $? -ne 0 ]
then
    ((PUSH_TO_ECR)) && echo "Repo $IMAGE doesn't exist. Creating..."
    ((PUSH_TO_ECR)) && aws ecr create-repository --repository-name "$IMAGE" --image-scanning-configuration "scanOnPush=true" --profile $PROFILE --region $REGION > /dev/null
else
    ((PUSH_TO_ECR)) && echo "Repo $IMAGE exist."
fi

echo "Authenticating with ECR"
((PUSH_TO_ECR)) && aws ecr get-login-password --region $REGION --profile $PROFILE | docker login --username AWS --password-stdin $REPO_BASEURL

echo "Building docker image"
docker build -t $IMAGE -f $DOCKERFILE .
docker tag $IMAGE:latest $REPO_BASEURL/$IMAGE:latest

echo "Publishing docker image"
((PUSH_TO_ECR)) && docker push $REPO_BASEURL/$IMAGE:latest

echo "Done"