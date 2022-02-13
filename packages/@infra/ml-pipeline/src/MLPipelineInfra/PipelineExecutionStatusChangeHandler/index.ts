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
import { aws_dynamodb as ddb, aws_lambda as lambda } from 'aws-cdk-lib'
import { namespaced, common_lambda as dlambda, common_iam as ciam } from '@infra/common'

interface Environment extends dlambda.DeclaredLambdaEnvironment {
  readonly MODEL_TRAINING_EXECUTION_TABLE: string
  readonly MODEL_TRAININGS_INDEX: string
}

interface Dependencies extends dlambda.DeclaredLambdaDependencies {
  readonly modelTrainingExecution: ddb.ITable
  readonly modelTrainingsPipelineExecIndexName: string
}

type TDeclaredProps = dlambda.DeclaredLambdaProps<Environment, Dependencies>

export class PipelineExecutionStatusChangeHandlerLambda extends dlambda.DeclaredLambdaFunction<
  Environment,
  Dependencies
> {
  constructor(scope: Construct, id: string, props: dlambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { modelTrainingExecution, modelTrainingsPipelineExecIndexName } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'PipelineExecutionStatusChangeHandler'),
      description: 'Pipeline Execution Status Change Handler',
      code: lambda.Code.fromAsset(
        dlambda.getLambdaDistPath(__dirname, '@lambda/pipeline-execution-status-change-handler.zip'),
      ),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        MODEL_TRAINING_EXECUTION_TABLE: modelTrainingExecution.tableName,
        MODEL_TRAININGS_INDEX: modelTrainingsPipelineExecIndexName,
      },
      initialPolicy: [
        ciam.PolicyStatements.ddb.readDDBTable(modelTrainingExecution.tableArn),
        ciam.PolicyStatements.ddb.readDDBTable(
          `${modelTrainingExecution.tableArn}/index/${modelTrainingsPipelineExecIndexName}`,
        ),
        ciam.PolicyStatements.ddb.updateDDBTable(modelTrainingExecution.tableArn),
      ],
    }

    super(scope, id, declaredProps)
  }
}
