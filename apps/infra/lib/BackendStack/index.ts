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
import { aws_s3 as s3 } from 'aws-cdk-lib'
import { sync as findUp } from 'find-up'
import * as path from 'path'
import { namespaced, setNamespace } from '@infra/common'
import { ApiWeb } from '@infra/api-web'
import { MlPipeline } from '@infra/ml-pipeline'
import { AppVariables, HostingDeployment } from '@infra/web-hosting'
import { PersistentBackendStack } from '../PersistentStack'

export interface BackendStackProps extends core.StackProps {
  readonly namespace: string
  readonly persistent: PersistentBackendStack
  readonly assetsBucketCsvKeyPrefix: string
  readonly pipelineName: string
  readonly modelTrainingsPipelineExecIndexName: string
  readonly modelEndpointArnIndexName: string
  readonly modelEndpointCleanupSchedule: string
  readonly modelEndpointExpiryTimeInMins: number
}

/**
 * Backend stack
 */
export class BackendStack extends core.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const {
      namespace,
      persistent: {
        dataStorage: {
          assetsMetadata,
          trainingTemplate,
          modelTrainingExecution,
          modelEndpointMaintenance,
          featureImportance,
          modelPrediction,
          assetsBucket,
          modelsBucket,
          pipelineBucket,
        },
        identityStack: { userPool, webAppClientId },
        websiteBucket,
      },
      assetsBucketCsvKeyPrefix,
      modelTrainingsPipelineExecIndexName,
      modelEndpointArnIndexName,
      modelEndpointExpiryTimeInMins,
      modelEndpointCleanupSchedule,
    } = props

    setNamespace(this, namespace)

    const packagesDir = findUp('packages', { cwd: __dirname, type: 'directory' }) || '../../../../../'

    // check out `packages/@infra/ml-pipeline/package.json build scripts
    const executorCodePath = path.join(packagesDir, '@infra', 'ml-pipeline', 'dist', '@py', 'executors.zip')

    const mlPipelineCreator = new MlPipeline(this, 'MlPipeline', {
      assetsBucket,
      assetsBucketCsvKeyPrefix,
      modelsBucket,
      pipelineBucket,
      websiteBucket,
      assetsMetadata,
      modelTrainingExecution,
      modelEndpointMaintenance,
      featureImportance,
      trainingTemplate,
      executorCodePath,
      modelTrainingsPipelineExecIndexName: namespaced(this, modelTrainingsPipelineExecIndexName),
      modelEndpointArnIndexName: namespaced(this, modelEndpointArnIndexName),
      modelEndpointExpiryTimeInMins,
      modelEndpointCleanupSchedule,
    })

    const { sagemakerPipelineArn, sagemakerPipelineName } = mlPipelineCreator

    const webApi = new ApiWeb(this, 'ApiWeb', {
      userPool,
      assetsBucket,
      assetsBucketCsvKeyPrefix,
      assetsMetadata,
      trainingTemplate,
      modelTrainingExecution,
      modelEndpointMaintenance,
      modelPrediction,
      featureImportance,
      modelsBucket,
      sagemakerExecutionRole: mlPipelineCreator.pipelineExecutionRole,
      sagemakerPipelineName,
      sagemakerPipelineArn,
    })

    const websiteBucketRef = s3.Bucket.fromBucketArn(this, 'WebsiteBucket', websiteBucket.bucketArn)
    const appVars = {
      REGION: this.region,
      USERPOOL_ID: userPool.userPoolId,
      USERPOOL_CLIENT_ID: webAppClientId,
      API_URL: webApi.restApi.url,
    }

    // find the website and solver bundle
    const appsDir = findUp('apps', { cwd: __dirname, type: 'directory' }) || '../../../'
    const websiteBundlePath = path.join(appsDir, 'website', 'build')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hostingDeployment = new HostingDeployment(this, 'WebsiteHostingDeployment', {
      websiteBundlePath,
      hostingBucket: websiteBucketRef,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const appVariables = new AppVariables(this, 'WebsiteAppVars', {
      appVars,
      hostingBucket: websiteBucketRef,
      appVarDestinationKey: 'static/appvars.js',
    })
  }
}
