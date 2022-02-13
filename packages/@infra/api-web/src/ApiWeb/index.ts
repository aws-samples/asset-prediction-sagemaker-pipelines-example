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
import {
  aws_apigateway as apigw,
  aws_cognito as cognito,
  aws_dynamodb as ddb,
  aws_iam as iam,
  aws_s3 as s3,
} from 'aws-cdk-lib'
import { namespaced, common_apigw, common_lambda } from '@infra/common'
import { AssetManagerLambda } from './AssetManager'
import { TrainingTemplateManagerLambda } from './TrainingTemplateManager'
import { ModelTrainingExecutionManagerLambda } from './ModelTrainingExecutionManager'
import { DownloadS3FileLambda } from './DownloadS3File'
import { HTTPMethod } from 'http-method-enum'
import { GetS3PresignedUrlLambda } from './GetS3PresignedUrl'
import { CreatePipelineExecutionLambda } from './CreatePipelineExecution'
import { ModelEndpointManagerLambda } from './ModelEndpointManager'
import { InvokeModelEndpointLambda } from './InvokeModelEndpoint'
import { ModelPredictionManagerLambda } from './ModelPredictionManager'

export interface ApiWebProps {
  readonly apiPrefix?: string
  readonly userPool: cognito.IUserPool
  readonly assetsMetadata: ddb.ITable
  readonly trainingTemplate: ddb.ITable
  readonly modelTrainingExecution: ddb.ITable
  readonly modelEndpointMaintenance: ddb.ITable
  readonly modelPrediction: ddb.ITable
  readonly featureImportance: ddb.ITable
  readonly assetsBucket: s3.IBucket
  readonly modelsBucket: s3.IBucket
  readonly sagemakerExecutionRole: iam.IRole
  readonly assetsBucketCsvKeyPrefix: string
  readonly sagemakerPipelineName: string
  readonly sagemakerPipelineArn: string
}

export class ApiWeb extends Construct {
  readonly restApi: common_apigw.RestApi

  constructor(scope: Construct, id: string, props: ApiWebProps) {
    super(scope, id)

    const {
      apiPrefix = 'api/web',
      userPool,
      assetsMetadata,
      trainingTemplate,
      modelTrainingExecution,
      modelEndpointMaintenance,
      modelPrediction,
      featureImportance,
      assetsBucket,
      assetsBucketCsvKeyPrefix,
      sagemakerPipelineName,
      sagemakerPipelineArn,
    } = props

    const assetUrlBase = `${apiPrefix}/asset`
    const trainingTemplateUrlBase = `${apiPrefix}/training-template`
    const modelTrainingExecutionUrlBase = `${apiPrefix}/model-training-execution`
    const downloadS3FileUrlBase = `${apiPrefix}/dl`
    const mlManagerUrlBase = `${apiPrefix}/ml`
    const modelPredictionUrlBase = `${apiPrefix}/model-prediction`

    const restApi = new common_apigw.RestApi(this, 'RestApi-Web', {
      restApiName: namespaced(this, 'WebApi'),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })
    this.restApi = restApi

    const cognitoAuthorizer = restApi.addCognitoAuthorizer([userPool.userPoolArn])
    const authorizerMethodOpt: apigw.MethodOptions = {
      authorizer: { authorizerId: cognitoAuthorizer.ref },
      authorizationType: apigw.AuthorizationType.COGNITO,
    }

    const { lambdaUtilsLayer } = new common_lambda.LambdaUtilsLayer(this, 'LambdaUtilsLayer', {})

    // ENDPOINTS and HANDLERS
    const assetMetaManagerEndpoint = restApi.addResourceWithAbsolutePath(`${assetUrlBase}`)
    const assetMetaManagerWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${assetUrlBase}/{assetId}`)

    const assetMetaManagerLambda = new AssetManagerLambda(restApi, 'AssetManagerLambda', {
      dependencies: {
        assetsBucket,
        assetsBucketCsvKeyPrefix,
        assetsMetadata,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: assetMetaManagerEndpoint,
      withIdEndpoint: assetMetaManagerWithIdEndpoint,
      lambdaFunction: assetMetaManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    const trainingTemplateEndpoint = restApi.addResourceWithAbsolutePath(`${trainingTemplateUrlBase}`)
    const trainingTemplateWithIdEndpoint = restApi.addResourceWithAbsolutePath(
      `${trainingTemplateUrlBase}/{trainingTemplateId}`,
    )

    const trainingTemplateManagerLambda = new TrainingTemplateManagerLambda(restApi, 'TrainingTemplateManagerLambda', {
      dependencies: {
        trainingTemplate,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: trainingTemplateEndpoint,
      withIdEndpoint: trainingTemplateWithIdEndpoint,
      lambdaFunction: trainingTemplateManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    const modelTrainingExecutionEndpoint = restApi.addResourceWithAbsolutePath(`${modelTrainingExecutionUrlBase}`)
    const modelTrainingExecutionWithIdEndpoint = restApi.addResourceWithAbsolutePath(
      `${modelTrainingExecutionUrlBase}/{modelTrainingExecutionId}`,
    )

    const modelTrainingExecutionManagerLambda = new ModelTrainingExecutionManagerLambda(
      restApi,
      'ModelTrainingExecutionManagerLambda',
      {
        dependencies: {
          modelTrainingExecution,
          lambdaUtilsLayer,
        },
      },
    )

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: modelTrainingExecutionEndpoint,
      withIdEndpoint: modelTrainingExecutionWithIdEndpoint,
      lambdaFunction: modelTrainingExecutionManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    const downloadS3FileEndpoint = restApi.addResourceWithAbsolutePath(`${downloadS3FileUrlBase}/{type}/{value}`)
    const downloadS3FileLambda = new DownloadS3FileLambda(restApi, 'DownloadS3FileLambda', {
      dependencies: {
        assetsBucket,
        assetsBucketCsvKeyPrefix,
      },
    })

    restApi.addFunctionToResource(downloadS3FileEndpoint, {
      function: downloadS3FileLambda,
      httpMethod: HTTPMethod.GET,
      methodOptions: authorizerMethodOpt,
    })

    const getS3PresignedUrlEndpoint = restApi.addResourceWithAbsolutePath(`${assetUrlBase}/get-presigned-url`)
    const getS3PresignedUrlLambda = new GetS3PresignedUrlLambda(restApi, 'GetS3PresignedUrlLambda', {
      dependencies: {
        assetsBucket,
        assetsBucketCsvKeyPrefix,
        lambdaUtilsLayer,
      },
    })

    restApi.addFunctionToResource(getS3PresignedUrlEndpoint, {
      function: getS3PresignedUrlLambda,
      httpMethod: HTTPMethod.POST,
      methodOptions: authorizerMethodOpt,
    })

    const createPipelineExecutionEndpoint = restApi.addResourceWithAbsolutePath(
      `${mlManagerUrlBase}/pipeline-execution`,
    )
    const createPipelineExecutionLambda = new CreatePipelineExecutionLambda(restApi, 'CreatePipelineExecutionLambda', {
      dependencies: {
        sagemakerPipelineName,
        sagemakerPipelineArn,
        lambdaUtilsLayer,
        modelTrainingExecution,
        trainingTemplate,
        assetsBucket,
        assetsBucketCsvKeyPrefix,
      },
    })

    restApi.addFunctionToResource(createPipelineExecutionEndpoint, {
      function: createPipelineExecutionLambda,
      httpMethod: HTTPMethod.POST,
      methodOptions: authorizerMethodOpt,
    })

    const invokeModelEndpointEndpoint = restApi.addResourceWithAbsolutePath(`${mlManagerUrlBase}/invoke-endpoint`)
    const invokeModelEndpointLambda = new InvokeModelEndpointLambda(restApi, 'InvokeModelEndpointLambda', {
      dependencies: {
        lambdaUtilsLayer,
        modelTrainingExecution,
        trainingTemplate,
        modelPrediction,
        assetsBucket,
        assetsBucketCsvKeyPrefix,
        modelEndpointMaintenance,
      },
    })

    restApi.addFunctionToResource(invokeModelEndpointEndpoint, {
      function: invokeModelEndpointLambda,
      httpMethod: HTTPMethod.POST,
      methodOptions: authorizerMethodOpt,
    })

    const modelEndpointManagerEndpoint = restApi.addResourceWithAbsolutePath(`${mlManagerUrlBase}/model-endpoint`)
    const modelEndpointManagerEndpointWithId = restApi.addResourceWithAbsolutePath(
      `${mlManagerUrlBase}/model-endpoint/{executionId}`,
    )
    const modelEndpointManagerLambda = new ModelEndpointManagerLambda(restApi, 'ModelEndpointManagerLambda', {
      dependencies: {
        lambdaUtilsLayer,
        modelTrainingExecution,
        modelEndpointMaintenance,
      },
    })

    restApi.addFunctionToResource(modelEndpointManagerEndpoint, {
      function: modelEndpointManagerLambda,
      httpMethod: HTTPMethod.POST,
      methodOptions: authorizerMethodOpt,
    })
    restApi.addFunctionToResource(modelEndpointManagerEndpointWithId, {
      function: modelEndpointManagerLambda,
      httpMethod: HTTPMethod.DELETE,
      methodOptions: authorizerMethodOpt,
    })

    const modelPredictionManagerEndpoint = restApi.addResourceWithAbsolutePath(`${modelPredictionUrlBase}`)
    const modelPredictionManagerWithIdEndpoint = restApi.addResourceWithAbsolutePath(
      `${modelPredictionUrlBase}/{modelPredictionId}`,
    )

    const modelPredictionManagerLambda = new ModelPredictionManagerLambda(restApi, 'ModelPredictionManagerLambda', {
      dependencies: {
        modelPrediction,
        featureImportance,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: modelPredictionManagerEndpoint,
      withIdEndpoint: modelPredictionManagerWithIdEndpoint,
      lambdaFunction: modelPredictionManagerLambda,
      methodOptions: authorizerMethodOpt,
    })
  }
}
