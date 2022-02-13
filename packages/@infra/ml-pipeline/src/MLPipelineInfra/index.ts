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
import {
  aws_dynamodb as ddb,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_sagemaker as sagemaker,
  aws_ecr as ecr,
  custom_resources as customresources,
} from 'aws-cdk-lib'
import * as handlebars from 'handlebars'
import { readFileSync, writeFileSync } from 'fs'
import { sync as findUp } from 'find-up'
import * as path from 'path'
import * as consts from 'cdk-constants'
import { namespaced, regionalNamespaced, common_iam } from '@infra/common'
import { PipelineExecutionStatusChangeHandlerLambda } from './PipelineExecutionStatusChangeHandler'
import { PipelineStepStatusChangeHandlerLambda } from './PipelineStepStatusChangeHandler'
import { ModelStateChangeHandlerLambda } from './ModelStateChangeHandler'
import { ModelEndpointStateChangeHandlerLambda } from './ModelEndpointStateChangeHandler'
import { ModelEndpointCleanupLambda } from './ModelEndpointCleanup'

export interface MlPipelineProps {
  readonly assetsBucket: s3.IBucket
  readonly modelsBucket: s3.IBucket
  readonly pipelineBucket: s3.IBucket
  readonly websiteBucket: s3.IBucket
  readonly assetsMetadata: ddb.ITable
  readonly trainingTemplate: ddb.ITable
  readonly modelTrainingExecution: ddb.ITable
  readonly modelEndpointMaintenance: ddb.ITable
  readonly featureImportance: ddb.ITable
  readonly executorCodePath: string
  readonly modelTrainingsPipelineExecIndexName: string
  readonly modelEndpointArnIndexName: string
  readonly modelEndpointExpiryTimeInMins: number
  readonly modelEndpointCleanupSchedule: string
  readonly assetsBucketCsvKeyPrefix: string
}

export class MlPipeline extends Construct {
  readonly pipelineExecutionRole: iam.IRole

  readonly sagemakerPipelineArn: string

  readonly sagemakerPipelineName: string

  constructor(scope: Construct, id: string, props: MlPipelineProps) {
    super(scope, id)
    const {
      assetsBucket,
      modelsBucket,
      pipelineBucket,
      websiteBucket,
      assetsMetadata,
      trainingTemplate,
      modelTrainingExecution,
      modelEndpointMaintenance,
      featureImportance,
      executorCodePath,
      modelTrainingsPipelineExecIndexName,
      modelEndpointArnIndexName,
      modelEndpointExpiryTimeInMins,
      modelEndpointCleanupSchedule,
      assetsBucketCsvKeyPrefix,
    } = props

    const pipelineCodeExecutorPrefix = 'code/executor'

    this.pipelineExecutionRole = new iam.Role(this, 'MlPipelineExecutionRole', {
      assumedBy: new iam.ServicePrincipal(consts.ServicePrincipals.SAGE_MAKER),
      roleName: regionalNamespaced(this, 'SagemakerPipelineExecutionRole'),
      description: 'ML Pipeline Execution Role',
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess')],
      inlinePolicies: {
        bucketAccess: new iam.PolicyDocument({
          statements: [
            common_iam.PolicyStatements.s3.readBucket(assetsBucket.bucketArn),
            common_iam.PolicyStatements.s3.readWriteBucket(modelsBucket.bucketArn),
            common_iam.PolicyStatements.s3.readBucket(pipelineBucket.bucketArn),
          ],
        }),
        ddbTableAccess: new iam.PolicyDocument({
          statements: [
            common_iam.PolicyStatements.ddb.readDDBTable(assetsMetadata.tableArn),
            common_iam.PolicyStatements.ddb.readDDBTable(trainingTemplate.tableArn),
            common_iam.PolicyStatements.ddb.readDDBTable(modelTrainingExecution.tableArn),
            common_iam.PolicyStatements.ddb.updateDDBTable(modelTrainingExecution.tableArn),
            common_iam.PolicyStatements.ddb.updateDDBTable(featureImportance.tableArn),
          ],
        }),
      },
    })

    // IMPORTANT: run `ml-pipeline-py/src/docker/build-processing-image.sh` first
    const processingStepDockerRepo = ecr.Repository.fromRepositoryName(
      this,
      'ProcessingStepRepository',
      namespaced(this, 'prediction-processing'),
    )

    const packagesDir = findUp('packages', { cwd: __dirname, type: 'directory' }) || '../../../../'
    const mlPipelineInfraDir = path.join(packagesDir, '@infra', 'ml-pipeline')
    const createPipelineJsonPath = path.join(
      mlPipelineInfraDir,
      'src',
      'pipeline-definition',
      'pipeline-template',
      'pipeline.json',
    )
    const createPipelineJsonContent = readFileSync(createPipelineJsonPath, { encoding: 'utf-8' })
    const createPipelineJsonTemplate = handlebars.compile(createPipelineJsonContent)

    const pipelineConfig = {
      baseJobPrefix: 'asset-prediction-example',
      processingInstanceTypeDefault: 'ml.m5.xlarge',
      modelTrainingInstanceTypeDefault: 'ml.m5.xlarge',
      processingInstanceCountDefault: 1,
      processingStepDockerImageUri: processingStepDockerRepo.repositoryUri,
      pipelineExecutionRoleArn: this.pipelineExecutionRole.roleArn,
      modelsBucketName: modelsBucket.bucketName,
      executorCodeS3Uri: `s3://${pipelineBucket.bucketName}/${pipelineCodeExecutorPrefix}`,
      assetsKeyPrefix: assetsBucketCsvKeyPrefix,
      assetsBucketName: assetsBucket.bucketName,
      region: core.Stack.of(this).region,
      assetsMetadataTableName: assetsMetadata.tableName,
      trainingTemplateTableName: trainingTemplate.tableName,
      modelTrainingsTableName: modelTrainingExecution.tableName,
      featureImportanceTableName: featureImportance.tableName,
    }

    const createPipelineJsonFilled = createPipelineJsonTemplate(pipelineConfig)
    const pipelineFilePath = path.join(mlPipelineInfraDir, 'dist', '@pipeline', 'pipeline-definition.json')
    writeFileSync(pipelineFilePath, createPipelineJsonFilled, { encoding: 'utf-8' })

    const customResourcePolicy = customresources.AwsCustomResourcePolicy.fromSdkCalls({
      resources: customresources.AwsCustomResourcePolicy.ANY_RESOURCE,
    })

    customResourcePolicy.statements.push(
      new iam.PolicyStatement({
        actions: ['s3:putObject*'],
        effect: iam.Effect.ALLOW,
        resources: [pipelineBucket.bucketArn, `${pipelineBucket.bucketArn}/*`],
      }),
    )

    const pipelineDefResourceParams = {
      service: 'S3',
      action: 'putObject',
      parameters: {
        Bucket: pipelineBucket.bucketName,
        Key: 'code/pipeline-definition.json',
        Body: createPipelineJsonFilled,
      },
      physicalResourceId: customresources.PhysicalResourceId.of('onDeploymentPipelineDef'),
      // ignoreErrorCodesMatching: 'AccessDenied',
    }

    const pipelineDefResource = new customresources.AwsCustomResource(this, 'pipelineDefResource', {
      onCreate: pipelineDefResourceParams,
      onUpdate: pipelineDefResourceParams,
      policy: customResourcePolicy,
    })

    const sagemakerPipeline = new sagemaker.CfnPipeline(this, 'PredictionPipeline', {
      pipelineDefinition: {
        PipelineDefinitionS3Location: {
          Bucket: pipelineBucket.bucketName,
          Key: pipelineDefResourceParams.parameters.Key,
        },
      },
      pipelineName: namespaced(this, 'asset-prediction-pipeline'),
      roleArn: this.pipelineExecutionRole.roleArn,
      pipelineDescription: 'Asset prediction pipeline',
      pipelineDisplayName: 'AssetPredictionPipeline',
    })
    // make sure the json is in the bucket
    sagemakerPipeline.node.addDependency(pipelineDefResource)

    this.sagemakerPipelineArn = core.Arn.format(
      { service: 'sagemaker', resource: `pipeline/${sagemakerPipeline.pipelineName}` },
      core.Stack.of(this),
    )
    this.sagemakerPipelineName = sagemakerPipeline.pipelineName

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const executorCodeDeployment = new s3deploy.BucketDeployment(this, 'ExecutorCodeDeployment', {
      destinationBucket: pipelineBucket,
      sources: [s3deploy.Source.asset(executorCodePath)],
      destinationKeyPrefix: pipelineCodeExecutorPrefix,
    })

    const pipelineExecutionStatusChangeHandler = new PipelineExecutionStatusChangeHandlerLambda(
      this,
      'ExecStatChangeHandler',
      {
        dependencies: {
          modelTrainingExecution,
          modelTrainingsPipelineExecIndexName,
          modelsBucket,
          websiteBucket,
        },
      },
    )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pipelineExecutionStatusChangeRule = new events.Rule(this, 'ExecStatChangeRule', {
      ruleName: namespaced(this, 'PipelineExecutionStatusChange'),
      description: 'Sagemaker Pipeline Execution Status Change',
      eventPattern: {
        source: ['aws.sagemaker'],
        detailType: ['SageMaker Model Building Pipeline Execution Status Change'],
        detail: {
          pipelineArn: [this.sagemakerPipelineArn],
        },
      },
      targets: [new eventsTargets.LambdaFunction(pipelineExecutionStatusChangeHandler)],
    })

    const pipelineStepStatusChangeHandler = new PipelineStepStatusChangeHandlerLambda(this, 'StepStatChangeHandler', {
      dependencies: {
        modelTrainingExecution,
        modelTrainingsPipelineExecIndexName,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pipelineStepStatusChangeRule = new events.Rule(this, 'StepStatChangeRule', {
      ruleName: namespaced(this, 'PipelineStepStatusChange'),
      description: 'Sagemaker Pipeline Step Status Change',
      eventPattern: {
        source: ['aws.sagemaker'],
        detailType: ['SageMaker Model Building Pipeline Execution Step Status Change'],
        detail: {
          pipelineArn: [this.sagemakerPipelineArn],
        },
      },
      targets: [new eventsTargets.LambdaFunction(pipelineStepStatusChangeHandler)],
    })

    const modelStateChangeHandler = new ModelStateChangeHandlerLambda(this, 'ModelStateChangeHandler', {
      dependencies: {
        modelTrainingExecution,
        modelTrainingsPipelineExecIndexName,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const modelStateChangeRule = new events.Rule(this, 'ModelStateChangeRule', {
      ruleName: namespaced(this, 'ModelStateChange'),
      description: 'Sagemaker Model State Change',
      eventPattern: {
        source: ['aws.sagemaker'],
        detailType: ['SageMaker Model State Change'],
      },
      targets: [new eventsTargets.LambdaFunction(modelStateChangeHandler)],
    })

    const modelEndpointStateChangeHandler = new ModelEndpointStateChangeHandlerLambda(
      this,
      'ModelEndpointStateChangeHnadler',
      {
        dependencies: {
          modelTrainingExecution,
          modelEndpointMaintenance,
          modelEndpointArnIndexName,
        },
      },
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const modelEndpointStateChangeRule = new events.Rule(this, 'ModelEndpointStateChangeRule', {
      ruleName: namespaced(this, 'ModelEndpointStateChange'),
      description: 'Sagemaker Endpoint State Change',
      eventPattern: {
        source: ['aws.sagemaker'],
        detailType: ['SageMaker Endpoint State Change'],
      },
      targets: [new eventsTargets.LambdaFunction(modelEndpointStateChangeHandler)],
    })

    const modelEndpointCleanupLambda = new ModelEndpointCleanupLambda(this, 'ModelEndpointCleanup', {
      dependencies: {
        modelTrainingExecution,
        modelEndpointMaintenance,
        modelEndpointExpiryTimeInMins,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const modelEndpointCleanupRule = new events.Rule(this, 'ModelEndpointCleanupRule', {
      ruleName: namespaced(this, 'ModelEndpointCleanup'),
      description: 'Model Endpoint Auto Cleanup',
      schedule: {
        expressionString: modelEndpointCleanupSchedule,
      },
      targets: [new eventsTargets.LambdaFunction(modelEndpointCleanupLambda)],
    })
  }
}
