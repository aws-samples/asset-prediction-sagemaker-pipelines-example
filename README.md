# Asset Prediction Sagemaker Pipelines Example

> :warning: Disclaimer: This code is provided `AS IS`. Check out the [LICENSE](./LICENSE) file.

## :star: Introduction

This **Asset Example** provides a ***prototype-level*** end-to-end **ML Prediction SageMaker Pipeline** for customers who want to use [Amazon Sagemaker](https://aws.amazon.com/sagemaker/) to predict (financial) timeseries data.

This example leverage the prediction model introduced in the blog post [Enhancing trading strategies through cloud services and machine learning](https://aws.amazon.com/blogs/industries/enhancing-trading-strategies-through-cloud-services-and-machine-learning/), but can be customised to any other market or any other timeseries type of data.

This example pushes the blog's code one step further by automating the whole deployment pipeline, leveraging AWS SageMaker:

* Automated listing of the datasets from the S3 origin buckets
* Automated Feature engineering on the data selected
* Automated model training with possible customization of the model's hyper-parameters
* Visualization of the status of the pipeline, its tasks and of the model inference results

This project also showcases the implementation of the following major components:

* Cloud deployment of (serverless) resources as Infrastructure as Code (IaC)
* Web Application, to interact with the pipeline and visualize the model's result and to interact with the platform
* Example scripts to gather data and load into the system

## Getting Started

* [Quickstart guide](./docs/quickstart.md)
* [Documentation](./docs/README.md)
* [Screenshots](./docs/screenshots.md)


## Folder structure
```
.
├── apps
    ├── asset-import (scripts to download and import assets)
    ├── infra (cdk application to deploy cloud resources)
    ├── scripts (scripts for local development)
    └── website (web app)
├── docs (detailed documentation)
└── packages
    ├── @config (project config related packages)
    └── @infra (lerna packages for infra deloyment)
```

## Requirements

### Dev Tools

* `nvm` with nodejs `v14` installed
* `yarn`
* `pyenv` with `python` `3.x` installed
* `docker`
* `jq`
* `vscode` with `eslint` plugin (preferred)

### AWS

* AWS Account Access ([setup](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)) with enough permission to deploy the application
* [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) with [named profile setup](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
