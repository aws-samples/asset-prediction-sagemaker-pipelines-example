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
import { namespaced, setNamespace } from '@infra/common'
import { DataStorage } from '@infra/data-storage'
import { IdentityStack } from '@infra/cognito-auth'
import { WebsiteHosting } from '@infra/web-hosting'

export interface PersistentBackendStackProps extends core.StackProps {
  readonly namespace: string
  readonly administratorEmail: string
  readonly administratorName: string
  readonly modelTrainingsPipelineExecIndexName: string
  readonly modelEndpointArnIndexName: string
}

/**
 * Persistence backend stack
 */
export class PersistentBackendStack extends core.Stack {
  readonly dataStorage: DataStorage

  readonly identityStack: IdentityStack

  readonly websiteBucket: s3.IBucket

  constructor(scope: Construct, id: string, props: PersistentBackendStackProps) {
    super(scope, id, props)

    const {
      namespace,
      administratorEmail,
      administratorName,
      modelTrainingsPipelineExecIndexName,
      modelEndpointArnIndexName,
    } = props

    setNamespace(this, namespace)

    const dataStorage = new DataStorage(this, 'DataStorage', {
      modelTrainingsPipelineExecIndexName: namespaced(this, modelTrainingsPipelineExecIndexName),
      modelEndpointArnIndexName: namespaced(this, modelEndpointArnIndexName),
    })

    const identityStack = new IdentityStack(this, 'Identity', {
      administratorEmail,
      administratorName,
    })

    const websiteHosting = new WebsiteHosting(this, 'WebsiteHosting', {
      bucketName: 'website',

      // react routing helper
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/',
        },
      ],
    })

    this.dataStorage = dataStorage
    this.identityStack = identityStack
    this.websiteBucket = websiteHosting.hostingBucket
  }
}
