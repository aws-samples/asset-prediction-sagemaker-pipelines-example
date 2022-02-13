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

/* eslint-disable no-console */
const aws = require('aws-sdk')
const { success, fail } = require('/opt/lambda-utils')

const PIPELINE_NAME = process.env.PIPELINE_NAME
const ASSET_BUCKET_NAME = process.env.ASSET_BUCKET_NAME
const ASSET_BUCKET_KEYPREFIX = process.env.ASSET_BUCKET_KEYPREFIX
const MODEL_TRAINING_EXECUTION_TABLE = process.env.MODEL_TRAINING_EXECUTION_TABLE
const TRAINING_TEMPLATE_TABLE = process.env.TRAINING_TEMPLATE_TABLE

const sagemaker = new aws.SageMaker()
const ddb = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: pipelinehandler :: POST :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: pipelinehandler :: POST :: body :: ${JSON.stringify(body)}`)

  const { executionId } = body
  let modelTrainingExecution = null
  try {
    const modelTrainingExecutionResp = await ddb
      .get({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: executionId,
        },
      })
      .promise()

    if (modelTrainingExecutionResp.Item != null) {
      modelTrainingExecution = modelTrainingExecutionResp.Item
    } else {
      return fail({ message: `ModelTrainingExecution not found with id ${executionId}` }, 404)
    }
  } catch (err) {
    console.error(`Error retreiving training instance from DDB :: ${JSON.stringify(err)}`, err)

    return fail({ message: `Error retreiving training instance from DDB with id ${executionId}` })
  }

  try {
    if (modelTrainingExecution != null && modelTrainingExecution.pipelineExecutionArn != null) {
      return fail(
        {
          message:
            'Pipeline execution already in progress. ' +
            'If you want to retrain the model clone the ' +
            'execution or wait until the current one is finished',
        },
        409,
      ) // HTTP 409 - CONFLICT
    }

    let template = null
    try {
      const templateResp = await ddb
        .get({
          TableName: TRAINING_TEMPLATE_TABLE,
          Key: {
            Id: modelTrainingExecution.templateId,
          },
        })
        .promise()

      template = templateResp.Item
    } catch (_err) {
      console.error(`Error retreiving training template from DDB :: ${JSON.stringify(_err)}`, _err)

      return fail({
        message: `Error retreiving training template from DDB with id ${modelTrainingExecution.templateId}`,
      })
    }

    const deepARMeta = template.deepARMeta

    const pipelineExecutionResult = await sagemaker
      .startPipelineExecution({
        PipelineName: PIPELINE_NAME,
        PipelineParameters: [
          { Name: 'ExecutionId', Value: executionId },
          { Name: 'AssetsData', Value: `s3://${ASSET_BUCKET_NAME}/${ASSET_BUCKET_KEYPREFIX}` },
          { Name: 'HyperParamEpochs', Value: `${deepARMeta.hyperParams.epochs}` },
          { Name: 'HyperParamEarlyStoppingPatience', Value: `${deepARMeta.hyperParams.early_stopping_patience}` },
          { Name: 'HyperParamMiniBatchSize', Value: `${deepARMeta.hyperParams.mini_batch_size}` },
          { Name: 'HyperParamLearningRate', Value: `${deepARMeta.hyperParams.learning_rate}` },
          { Name: 'HyperParamContextLength', Value: `${deepARMeta.contextLength}` },
          { Name: 'HyperParamPredictionLength', Value: `${deepARMeta.predictionLength}` },
          { Name: 'ModelPackageGroupName', Value: `asset-prediction-${Math.floor(new Date().getTime() / 1000.0)}` },
        ],
      })
      .promise()

    const pipelineExecutionArn = pipelineExecutionResult.PipelineExecutionArn
    console.log(`Successfully started pipline execution: ${pipelineExecutionArn}`)

    const ddbUpdateRes = await ddb
      .update({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: executionId,
        },
        UpdateExpression:
          'set #pipelineExecutionArn = :pipelineExecutionArn, #trainingStatus = :trainingStatus, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#pipelineExecutionArn': 'pipelineExecutionArn',
          '#trainingStatus': 'trainingStatus',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':pipelineExecutionArn': pipelineExecutionArn,
          ':trainingStatus': 'STARTING',
          ':updatedAt': Date.now(),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise()

    console.log(
      `Added PipelineExecutionArn (${pipelineExecutionArn}) to training instance ${executionId}`,
      ddbUpdateRes,
    )

    return success(ddbUpdateRes.Attributes)
  } catch (err) {
    console.error(`Error starting sagemaker pipeline execution :: ${JSON.stringify(err)}`, err)

    return fail({ message: `Error starting sagemaker pipeline execution :: ${err}` })
  }
}

exports.handler = handler
