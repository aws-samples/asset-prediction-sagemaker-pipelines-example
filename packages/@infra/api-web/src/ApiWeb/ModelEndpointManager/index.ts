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
import { aws_dynamodb as ddb, aws_iam as iam, aws_lambda as lambda } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  readonly MODEL_TRAINING_EXECUTION_TABLE: string
  readonly MODEL_ENDPOINT_MAINTENANCE_TABLE: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly lambdaUtilsLayer: lambda.ILayerVersion
  readonly modelTrainingExecution: ddb.ITable
  readonly modelEndpointMaintenance: ddb.ITable
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class ModelEndpointManagerLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { lambdaUtilsLayer, modelTrainingExecution, modelEndpointMaintenance } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'ModelEndpointManager'),
      description: 'Model Endpoint Manager',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/model-endpoint-manager.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      layers: [lambdaUtilsLayer],
      environment: {
        MODEL_TRAINING_EXECUTION_TABLE: modelTrainingExecution.tableName,
        MODEL_ENDPOINT_MAINTENANCE_TABLE: modelEndpointMaintenance.tableName,
      },
      initialPolicy: [
        common_iam.PolicyStatements.ddb.readDDBTable(modelTrainingExecution.tableArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(modelTrainingExecution.tableArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(modelEndpointMaintenance.tableArn),
        new iam.PolicyStatement({
          actions: [
            'sagemaker:CreateEndpoint',
            'sagemaker:DeleteEndpoint',
            'sagemaker:CreateEndpointConfig',
            'sagemaker:DeleteEndpointConfig',
          ],
          effect: iam.Effect.ALLOW,
          resources: [
            core.Arn.format({ service: 'sagemaker', resource: 'endpoint/*' }, core.Stack.of(scope)),
            core.Arn.format({ service: 'sagemaker', resource: 'endpoint-config/*' }, core.Stack.of(scope)),
          ],
        }),
      ],
    }

    super(scope, id, declaredProps)
  }
}
