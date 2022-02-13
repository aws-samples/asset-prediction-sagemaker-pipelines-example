#!/bin/sh

set -e

export DEPLOYMENT_PROFILE=apspe
export DEPLOYMENT_REGION=ap-southeast-1
export DEPLOYMENT_NAMESPACE=apspe

STS=$(aws sts get-caller-identity --profile $DEPLOYMENT_PROFILE --region $DEPLOYMENT_REGION --output json)
printf "Based on your DEPLOYMENT_PROFILE and DEPLOYMENT_REGION, this is your caller identity:\n"
printf "$(echo $STS | jq)\n"
read -p "Is this correct (YyNn)? " -n 1 -r
[[ $REPLY =~ ^[Yy]$ ]] || exit 0
printf "\n"

export ACCOUNT_ID=$(echo $STS | jq .Account --raw-output)

# .npmrc in HOME
if [ -f "$HOME/.npmrc" ]; then
    printf "\nDetected $HOME/.npmrc file that may interfere with the installation\n"
    printf "Make sure that you have all settings properly setup (or delete it from $HOME/.npmrc)"
    read -p "My .npmrc is correct (YyNn)?\n " -n 1 -r
    [[ $REPLY =~ ^[Yy]$ ]] || exit 0
    printf "\n"
fi

# DOCKER check
if (! docker stats --no-stream &> /dev/null); then
    printf "Docker daemon is not running. Docker is mandatory to run for this deployment\n"
    read -p "Start docker (YyNn)? " -n 1 -r
    [[ $REPLY =~ ^[Yy]$ ]] || exit 0
    printf "\n"

    # Mac OS launch Docker
    open /Applications/Docker.app
    # Wait until Docker daemon is running and has completed initialisation
    while (! docker stats --no-stream &> /dev/null); do
        # Docker takes a few seconds to initialize
        echo "Waiting for Docker to launch..."
        sleep 5
    done
fi

printf "\nMake sure you have set up the necessary configuration parameters in 'apps/infra/config'\n"
printf "Check out the README for further instructions.\n\n"
read -p "My infra config is properly setup (YyNn): " -n 1 -r
[[ $REPLY =~ ^[Yy]$ ]] || exit 0
printf "\n"

clear
printf "One-click deployment for Asset Prediction Sagemaker Pipelines Example\n"
printf "=====================================================================\n"
printf "\n"
printf "For requirements, please refer to docs/README.md\n"
printf "\n"
printf "Make sure that your NPMRC settings are correct!\n"
printf "\n"
printf "The following deployment steps will be performed:\n"
printf "\t1. Build the whole project\n"
printf "\t2. Build docker image for processing step and push it to ECR\n"
printf "\t3. CDK deploy the whole infrastructure\n"
printf "\n"
read -p "Ready (YyNn)? " -n 1 -r
[[ $REPLY =~ ^[Yy]$ ]] || exit 0
printf "\n"

# 
# yarn install
yarn init-project
yarn build:all

printf "\n"
printf "\nyarn install && yarn build finished"
printf "\n"
sleep 1

pushd packages/@infra/ml-pipeline/src/pipeline-definition/docker
./build-processing-image.sh
popd

printf "\n"
printf "\nbuilding the processing docker image is finished"
printf "\n"
sleep 1

echo $(pwd)

pushd apps/infra
yarn cdk:bootstrap --profile "${DEPLOYMENT_PROFILE}" --region "${DEPLOYMENT_REGION}"
yarn dev:deploy --profile "${DEPLOYMENT_PROFILE}" --region "${DEPLOYMENT_REGION}"
popd

printf "\n"
printf "\nCDK deployment done."
printf "\n"

printf "\n"
printf "You should have received an email with your credentials to the email address you set in apps/infra/config/default-XXXXXXXXXXXX.json file.\n"

URL=$(aws cloudfront list-distributions --profile ${DEPLOYMENT_PROFILE} --output text --query 'DistributionList.Items[0].DomainName')
printf "\n"
printf "Head over to https://${URL} and use the credentials you received in the email.\n"
printf "\n"