# Security

The security considerations during the design and implementation of the prototype are as follows:

1. It is highly encouraged to use resource-based permissions and policies wherever is possible
1. Review the `createSignedPost` call that is used to help the client to upload CSV files. Its `Expires` parameter may be set to a shorter value (currently 5 mins).

We used the following tools to thoroughly review the security aspect of this project:

1. `yarn audit --groups dependencies` - to investigate vulnerabilities in the npm packages
1. `scanOnPush=1` when pushing docker image
1. `trivy` to scan for vulnerabilities in docker images
1. `bandit` - to scan for vulnerabilities in python code
1. `sonarcube`

## Potential improvements

The following list is highly recommended to appliy to your resources in your account:

1. Use KMS managed keys instead of S3_MANAGED
1. Sagemaker Pipeline execution is granted `AmazonSageMakerFullAccess` which could be tightened even more based on the resources created in the deployment process.
1. The web application hosted via cloudfront is exposed to the internet. Use WAF in front of cloudfront to make it more secure.


## Useful links

* https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html
* https://docs.aws.amazon.com/sagemaker/latest/dg/api-permissions-reference.html
* https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html
