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
import { aws_dynamodb as ddb, aws_s3 as s3 } from 'aws-cdk-lib'
import { namespaced, namespacedBucket } from '@infra/common'

export interface DataStorageProps extends core.NestedStackProps {
  readonly modelTrainingsPipelineExecIndexName: string
  readonly modelEndpointArnIndexName: string
}

export class DataStorage extends core.NestedStack {
  public readonly assetsMetadata: ddb.ITable

  public readonly trainingTemplate: ddb.ITable

  public readonly modelTrainingExecution: ddb.ITable

  public readonly modelEndpointMaintenance: ddb.ITable

  public readonly modelPrediction: ddb.ITable

  public readonly featureImportance: ddb.ITable

  public readonly assetsBucket: s3.IBucket

  public readonly modelsBucket: s3.IBucket

  public readonly pipelineBucket: s3.IBucket

  constructor(scope: Construct, id: string, props: DataStorageProps) {
    super(scope, id, props)

    const { modelTrainingsPipelineExecIndexName, modelEndpointArnIndexName } = props

    this.assetsMetadata = new ddb.Table(this, 'AssetsMetadataTable', {
      tableName: namespaced(this, 'asset-metadata'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    this.trainingTemplate = new ddb.Table(this, 'TrainingTemplateTable', {
      tableName: namespaced(this, 'training-template'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    const modelTrainingExecution = new ddb.Table(this, 'ModelTrainingExecutionTable', {
      tableName: namespaced(this, 'model-training-execution'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    // to be able to query the table with pipelineExecutionArn field
    modelTrainingExecution.addGlobalSecondaryIndex({
      indexName: modelTrainingsPipelineExecIndexName,
      partitionKey: {
        name: 'pipelineExecutionArn',
        type: ddb.AttributeType.STRING,
      },
    })

    this.modelTrainingExecution = modelTrainingExecution

    const modelEndpointMaintenance = new ddb.Table(this, 'ModelEndpointMaintenance', {
      tableName: namespaced(this, 'model-endpoint-maintenance'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    modelEndpointMaintenance.addGlobalSecondaryIndex({
      indexName: modelEndpointArnIndexName,
      partitionKey: {
        name: 'endpointArn',
        type: ddb.AttributeType.STRING,
      },
    })

    this.modelEndpointMaintenance = modelEndpointMaintenance

    this.modelPrediction = new ddb.Table(this, 'ModelPrediction', {
      tableName: namespaced(this, 'model-prediction'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    this.featureImportance = new ddb.Table(this, 'FeatureImportance', {
      tableName: namespaced(this, 'feature-importance'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: namespacedBucket(this, 'assets'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
        },
      ],
    })

    this.modelsBucket = new s3.Bucket(this, 'ModelsBucket', {
      bucketName: namespacedBucket(this, 'models'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    })

    const pipelineBucket = new s3.Bucket(this, 'PipelineBucket', {
      bucketName: namespacedBucket(this, 'ml-pipeline'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    })

    this.pipelineBucket = pipelineBucket
  }
}
