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
import { aws_apigateway as apigw, aws_lambda as lambda } from 'aws-cdk-lib'
import { namespaced } from '../../'
import { getLambdaDistPath } from '../DeclaredLambdaFunction'
import { RestApi } from '../../apigw'
import { HTTPMethod } from 'http-method-enum'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LambdaUtilsLayerProps {}

export class LambdaUtilsLayer extends Construct {
  readonly lambdaUtilsLayer: lambda.ILayerVersion

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props: LambdaUtilsLayerProps) {
    super(scope, id)

    const lambdaUtilsLayer = new lambda.LayerVersion(this, 'LambdaUtilsLayer', {
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      description: 'Lambda Utils Layer',
      layerVersionName: namespaced(this, 'LambdaUtils'),
      code: lambda.Code.fromAsset(getLambdaDistPath(__dirname, '@lambda/lambda-utils.zip')),
    })

    this.lambdaUtilsLayer = lambdaUtilsLayer
  }
}

interface AllowMethods {
  listGet?: boolean
  withIdGet?: boolean
  post?: boolean
  put?: boolean
  delete?: boolean
}

export interface RegisterManagerFunctionProps {
  restApi: RestApi
  endpoint: apigw.IResource
  withIdEndpoint: apigw.IResource
  lambdaFunction: lambda.Function
  methodOptions?: apigw.MethodOptions
  allowMethods?: AllowMethods
}

const DefaultAllowMethods: AllowMethods = {
  listGet: true,
  withIdGet: true,
  post: true,
  put: true,
  delete: true,
}

export const registerManagerFunction = (props: RegisterManagerFunctionProps): void => {
  const { restApi, endpoint, withIdEndpoint, lambdaFunction, methodOptions, allowMethods } = props

  const allow = { ...DefaultAllowMethods, ...allowMethods }

  // :: ListAll
  if (allow.listGet) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.GET,
      methodOptions,
    })
  }

  // :: GetById
  if (allow.withIdGet) {
    restApi.addFunctionToResource(withIdEndpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.GET,
      methodOptions,
    })
  }

  // :: CreateNew
  if (allow.post) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.POST,
      methodOptions,
    })
  }

  // :: Update
  if (allow.put) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.PUT,
      methodOptions,
    })
  }

  // :: Delete
  if (allow.delete) {
    restApi.addFunctionToResource(withIdEndpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.DELETE,
      methodOptions,
    })
  }
}
