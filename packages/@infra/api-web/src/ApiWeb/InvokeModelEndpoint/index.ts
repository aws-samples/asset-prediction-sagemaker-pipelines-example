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
import { aws_dynamodb as ddb, aws_iam as iam, aws_lambda as lambda, aws_s3 as s3 } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  readonly MODEL_TRAINING_EXECUTION_TABLE: string
  readonly TRAINING_TEMPLATE_TABLE: string
  readonly ASSET_BUCKET_NAME: string
  readonly ASSET_BUCKET_KEYPREFIX: string
  readonly MODEL_ENDPOINT_MAINTENANCE_TABLE: string
  readonly MODEL_PREDICTION_TABLE: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly lambdaUtilsLayer: lambda.ILayerVersion
  readonly modelTrainingExecution: ddb.ITable
  readonly trainingTemplate: ddb.ITable
  readonly modelEndpointMaintenance: ddb.ITable
  readonly modelPrediction: ddb.ITable
  readonly assetsBucket: s3.IBucket
  readonly assetsBucketCsvKeyPrefix: string
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class InvokeModelEndpointLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const {
      lambdaUtilsLayer,
      modelTrainingExecution,
      trainingTemplate,
      modelEndpointMaintenance,
      modelPrediction,
      assetsBucket,
      assetsBucketCsvKeyPrefix,
    } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'InvokeModelEndpoint'),
      description: 'Invoke Model Endpoint',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/invoke-model-endpoint.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      layers: [lambdaUtilsLayer],
      environment: {
        MODEL_TRAINING_EXECUTION_TABLE: modelTrainingExecution.tableName,
        TRAINING_TEMPLATE_TABLE: trainingTemplate.tableName,
        ASSET_BUCKET_NAME: assetsBucket.bucketName,
        ASSET_BUCKET_KEYPREFIX: assetsBucketCsvKeyPrefix,
        MODEL_ENDPOINT_MAINTENANCE_TABLE: modelEndpointMaintenance.tableName,
        MODEL_PREDICTION_TABLE: modelPrediction.tableName,
      },
      initialPolicy: [
        common_iam.PolicyStatements.ddb.readDDBTable(modelTrainingExecution.tableArn),
        common_iam.PolicyStatements.ddb.readDDBTable(trainingTemplate.tableArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(modelEndpointMaintenance.tableArn),
        common_iam.PolicyStatements.s3.readBucket(assetsBucket.bucketArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(modelPrediction.tableArn),
        new iam.PolicyStatement({
          actions: ['sagemaker:InvokeEndpoint'],
          effect: iam.Effect.ALLOW,
          resources: [core.Arn.format({ service: 'sagemaker', resource: 'endpoint/*' }, core.Stack.of(scope))],
        }),
      ],
    }

    super(scope, id, declaredProps)
  }
}
