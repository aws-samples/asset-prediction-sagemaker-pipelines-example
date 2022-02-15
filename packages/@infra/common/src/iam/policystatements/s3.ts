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

import { aws_iam as iam } from 'aws-cdk-lib'
import { S3 } from 'cdk-iam-actions/lib/actions'

const bucketPolicyStatement = (actions: string[], bucketArn: string): iam.PolicyStatement => {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions,
    resources: [bucketArn, `${bucketArn}/*`],
  })

  return policyStatement
}

export const readBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.GET_OBJECT, S3.HEAD_BUCKET, S3.LIST_BUCKET], bucketArn)
}

export const writeBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.PUT_OBJECT, S3.PUT_OBJECT_ACL], bucketArn)
}

export const readWriteBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement(
    [S3.GET_OBJECT, S3.HEAD_BUCKET, S3.LIST_BUCKET, S3.PUT_OBJECT, S3.PUT_OBJECT_ACL],
    bucketArn,
  )
}

export const deleteObjectBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.DELETE_OBJECT], bucketArn)
}