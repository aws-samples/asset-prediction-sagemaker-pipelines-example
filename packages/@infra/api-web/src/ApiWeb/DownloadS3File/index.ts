/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                               *
 *                                                                                                                   *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of                                  *
 *  this software and associated documentation files (the "Software"), to deal in                                    *
 *  the Software without restriction, including without limitation the rights to                                     *
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of                                 *
 *  the Software, and to permit persons to whom the Software is furnished to do so.                                  *
 *                                                                                                                   *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR                                       *
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS                                 *
 *  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR                                   *
 *  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER                                   *
 *  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN                                          *
 *  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                                       *
 *********************************************************************************************************************/

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_lambda as lambda, aws_s3 as s3 } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  ASSET_BUCKET_NAME: string
  ASSET_BUCKET_KEYPREFIX: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly assetsBucket: s3.IBucket
  readonly assetsBucketCsvKeyPrefix: string
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class DownloadS3FileLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { assetsBucket, assetsBucketCsvKeyPrefix } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'DownloadS3File'),
      description: 'Download S3 file function',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/download-s3-file.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        ASSET_BUCKET_NAME: assetsBucket.bucketName,
        ASSET_BUCKET_KEYPREFIX: assetsBucketCsvKeyPrefix,
      },
      initialPolicy: [common_iam.PolicyStatements.s3.readBucket(assetsBucket.bucketArn)],
    }

    super(scope, id, declaredProps)
  }
}
