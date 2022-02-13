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
const sagemaker = new aws.SageMaker()

const getTag = async (modelArn) => {
  try {
    const modelResp = await sagemaker.listTags({ ResourceArn: modelArn }).promise()

    if (modelResp.Tags == null) {
      return
    }

    let ppExArn
    for (const tag of modelResp.Tags) {
      if (tag.Key === 'sagemaker:pipeline-execution-arn') {
        ppExArn = tag.Value
        break
      }
    }

    return ppExArn
  } catch (err) {
    console.error(`Error while getting tags for ${modelArn}`)
  }
}
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const handler = async (event) => {
  console.log(`:: model state change handler :: ${JSON.stringify(event)}`)

  const {
    ModelName,
    PrimaryContainer: { ModelDataUrl },
    ModelArn,
    Tags,
  } = event.detail
  let pipelineExecutionArn = Tags['sagemaker:pipeline-execution-arn']

  if (pipelineExecutionArn == null) {
    console.warn('PipelineExecutionARN was not added to Tags. Trying to retrieve tags directly')

    const ppExArn = await getTag(ModelArn)

    if (ppExArn == null) {
      console.log('pipelineExecutionARN still not found (from listTags). Waiting 5 seconds')
      await delay(5000)
      const ppExArn = await getTag(ModelArn)

      if (ppExArn == null) {
        console.log('pipelineExecutionARN not found from listTags after waiting 5 seconds. skipping...')

        return
      } else {
        pipelineExecutionArn = ppExArn
        console.log('pipelineExecutionARN found from listTags after waiting 5 seconds')
      }
    } else {
      console.log('pipelineExecutionARN found from listTags')
      pipelineExecutionArn = ppExArn
    }
  }

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
    const modelInfo = {
      name: ModelName,
      arn: ModelArn,
      dataUrl: ModelDataUrl,
    }

    const updateResp = await ddb
      .update({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: modelTrainingExecution.Id,
        },
        UpdateExpression: 'SET #modelInfo = :modelInfo, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#modelInfo': 'modelInfo',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':modelInfo': modelInfo,
          ':updatedAt': Date.now(),
        },
      })
      .promise()
  } catch (err) {
    console.error(`Error retreiving/updating training instance from DDB :: ${JSON.stringify(err)}`, err)
  }
}

exports.handler = handler
