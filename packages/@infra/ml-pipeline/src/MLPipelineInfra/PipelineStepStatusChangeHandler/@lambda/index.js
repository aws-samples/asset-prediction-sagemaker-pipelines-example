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

const MODEL_TRAINING_EXECUTION_TABLE = process.env.MODEL_TRAINING_EXECUTION_TABLE
const MODEL_TRAININGS_INDEX = process.env.MODEL_TRAININGS_INDEX

const ddb = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  console.log(`:: pipeline step status change handler :: ${JSON.stringify(event)}`)

  const { pipelineExecutionArn } = event.detail
  try {
    const modelTrainingExecutionResp = await ddb
      .query({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        IndexName: MODEL_TRAININGS_INDEX,
        KeyConditionExpression: 'pipelineExecutionArn = :pipelineExecutionArn',
        ExpressionAttributeValues: {
          ':pipelineExecutionArn': pipelineExecutionArn,
        },
      })
      .promise()

    const modelTrainingExecution = modelTrainingExecutionResp.Items[0]
    const { stepStartTime, stepEndTime, stepType, previousStepStatus, currentStepStatus } = event.detail
    const stepChangeObj = {
      stepStartTime,
      stepEndTime,
      stepType,
      previousStepStatus,
      currentStepStatus,
    }

    if (modelTrainingExecution.pipelineStepStatusChanges == null) {
      modelTrainingExecution.pipelineStepStatusChanges = [stepChangeObj]
    } else {
      modelTrainingExecution.pipelineStepStatusChanges.push(stepChangeObj)
      modelTrainingExecution.pipelineStepStatusChanges.sort((a, b) => {
        const diff = Date.parse(a.stepStartTime) - Date.parse(b.stepStartTime)

        if (diff === 0) {
          if (a.stepEndTime != null && b.stepEndTime == null) {
            return 1
          } else if (a.stepEndTime == null && b.stepEndTime != null) {
            return -1
          } else {
            return 0
          }
        } else {
          return diff
        }
      })
    }

    const updateResp = await ddb
      .update({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: modelTrainingExecution.Id,
        },
        UpdateExpression: 'SET #stepStatusChanges = :stepStatusChanges, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#stepStatusChanges': 'pipelineStepStatusChanges',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':stepStatusChanges': modelTrainingExecution.pipelineStepStatusChanges,
          ':updatedAt': Date.now(),
        },
      })
      .promise()
  } catch (err) {
    console.error(`Error retreiving/updating training instance from DDB :: ${JSON.stringify(err)}`, err)
  }
}

exports.handler = handler
