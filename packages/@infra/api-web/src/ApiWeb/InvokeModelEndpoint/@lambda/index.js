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
const dayjs = require('dayjs')

const MODEL_TRAINING_EXECUTION_TABLE = process.env.MODEL_TRAINING_EXECUTION_TABLE
const TRAINING_TEMPLATE_TABLE = process.env.TRAINING_TEMPLATE_TABLE
const MODEL_ENDPOINT_MAINTENANCE_TABLE = process.env.MODEL_ENDPOINT_MAINTENANCE_TABLE
const ASSET_BUCKET_NAME = process.env.ASSET_BUCKET_NAME
const ASSET_BUCKET_KEYPREFIX = process.env.ASSET_BUCKET_KEYPREFIX
const MODEL_PREDICTION_TABLE = process.env.MODEL_PREDICTION_TABLE

const sagemakerRuntime = new aws.SageMakerRuntime()
const ddb = new aws.DynamoDB.DocumentClient()
const s3 = new aws.S3()

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: invoke-model-endpoint :: POST :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: invoke-model-endpoint :: POST :: body :: ${JSON.stringify(body)}`)

  const { executionId, quantiles, numSamples } = body
  let modelTrainingExecution = null
  let trainingTemplate = null
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

    const trainingTemplateResp = await ddb
      .get({
        TableName: TRAINING_TEMPLATE_TABLE,
        Key: {
          Id: modelTrainingExecution.templateId,
        },
      })
      .promise()

    if (trainingTemplateResp.Item != null) {
      trainingTemplate = trainingTemplateResp.Item
    } else {
      return fail({ message: `TrainingTemplate not found with id ${modelTrainingExecution.templateId}` }, 404)
    }
  } catch (err) {
    console.error(`Error retreiving training instance/template from DDB :: ${JSON.stringify(err)}`, err)

    return fail({ message: `Error retreiving training instance/template from DDB with id ${executionId}` })
  }

  try {
    if (modelTrainingExecution != null && modelTrainingExecution.modelInfo == null) {
      return fail({
        message: 'No model is assigned to modelTrainingExecution. ' + 'Cannot invoke a model endpoint.',
      })
    }

    const { modelInfo } = modelTrainingExecution
    const endpointName = `endpoint-${modelTrainingExecution.Id}`

    const bucketKey = `${ASSET_BUCKET_KEYPREFIX}/${trainingTemplate.predictedAsset}.csv`

    console.log(`Loading ${bucketKey}`)
    const csvFile = await s3
      .getObject({
        Bucket: ASSET_BUCKET_NAME,
        Key: bucketKey,
      })
      .promise()

    // load CSV file from s3
    const csv = Buffer.from(csvFile.Body).toString('utf-8')
    // get lines as an array
    const csvLines = csv.split('\n')
    // remove header line
    csvLines.shift()
    console.log(`Loaded ${bucketKey} with ${csvLines.length} data lines.`)

    const {
      startDataset: trainingStartTimestamp,
      endTraining: trainingEndTimestamp,
      predictionLength,
      contextLength,
    } = trainingTemplate.deepARMeta

    const predictionTargetWithDate = []
    const windowItems = []

    const csvEntries = csvLines.map((line) => {
      const parts = line.split(',')
      const dateStr = parts[0].trim()
      const timestamp = dayjs(dateStr).valueOf()

      return {
        dateStr,
        timestamp,
        value: parseFloat(parts[1].trim()),
      }
    })

    let trainingEndIdx = -1
    let prevTimestamp = -1
    for (let idx = 0; idx < csvEntries.length; idx++) {
      const entry = csvEntries[idx]

      if (entry.timestamp >= trainingStartTimestamp && entry.timestamp <= trainingEndTimestamp) {
        predictionTargetWithDate.push(entry)
      }

      if (prevTimestamp < trainingEndTimestamp && entry.timestamp >= trainingEndTimestamp) {
        trainingEndIdx = idx
      }
      prevTimestamp = entry.timestamp
    }

    if (trainingEndIdx === -1) {
      const errMsg = "trainingEndIdx hasn't been found. quitting."
      console.error(errMsg)

      return fail({ message: errMsg })
    }

    // don't overindex on the left/right side
    const windowIdxStart = Math.max(0, trainingEndIdx - contextLength)
    const windowIdxEnd = Math.min(csvLines.length, trainingEndIdx + predictionLength)

    // go through the entries and pick the
    // [trainingEnd-contextLen; trainingEnd+predictionLen] interval
    let windowIdx = windowIdxStart
    while (windowIdx <= windowIdxEnd) {
      const entry = csvEntries[windowIdx]
      windowItems.push({
        date: entry.dateStr,
        value: entry.value,
      })
      windowIdx++
    }

    console.log(`${predictionTargetWithDate.length} entries after filtering data for training start/end.`)
    console.log(`${windowItems.length} entries with contextLen - predictedLen around endTraining.`)

    if (predictionTargetWithDate.length === 0) {
      const errMsg = 'PredictionTarget data empty. Check training start/end, contextLen/predictionLen values!'
      console.error(errMsg)

      return fail({ message: errMsg })
    }

    // create invoke endpoint Body
    const invokeEndpointBodyData = {
      instances: [
        {
          start: predictionTargetWithDate[0].dateStr,
          target: predictionTargetWithDate.map((item) => item.value),
        },
      ],
      configuration: {
        num_samples: numSamples,
        output_types: ['quantiles', 'mean'],
        quantiles: quantiles.map((q) => `${q}`),
      },
    }

    // invoke endpoint
    const invokeEndpointResponse = await sagemakerRuntime
      .invokeEndpoint({
        Body: JSON.stringify(invokeEndpointBodyData),
        EndpointName: endpointName,
        ContentType: 'application/json',
      })
      .promise()

    const { Body: invokeEndpointResponseBodyStr } = invokeEndpointResponse
    const invokeEndpointResponseBody = Buffer.from(invokeEndpointResponseBodyStr).toString('utf-8')
    const predictionResult = JSON.parse(invokeEndpointResponseBody)

    console.log('Invoke result', invokeEndpointResponseBody)

    // update endpoint maintenance table to keep endpoint alive for another 10 mins
    const updateModelEndpointResp = await ddb
      .update({
        TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
        Key: {
          Id: executionId,
        },
        UpdateExpression: 'SET #lastInvokeTime = :lastInvokeTime',
        ExpressionAttributeNames: {
          '#lastInvokeTime': 'lastInvokeTime',
        },
        ExpressionAttributeValues: {
          ':lastInvokeTime': Date.now(),
        },
      })
      .promise()

    console.log(`Successfully updated ${MODEL_ENDPOINT_MAINTENANCE_TABLE} table lastInvokeTime`)

    // extract data from prediction object
    const { mean, quantiles: quantilesRes } = predictionResult.predictions[0]
    const predictionFirstDay = dayjs(trainingEndTimestamp).add(1, 'day')

    // make sure we won't index out of prediction dataset (lengths should be the same)
    const len = Math.min(mean.length, predictionLength)
    const prediction = { mean: [] }

    for (let i = 0; i < quantiles.length; i++) {
      prediction[`${quantiles[i]}`] = []
    }

    for (let i = 0; i < len; i++) {
      const day = predictionFirstDay.add(i, 'day').format('YYYY-MM-DD')

      prediction.mean.push({
        date: day,
        value: mean[i],
      })

      for (let j = 0; j < quantiles.length; j++) {
        prediction[`${quantiles[j]}`].push({
          date: day,
          value: quantilesRes[`${quantiles[j]}`][i],
        })
      }
    }

    const responseObj = {
      executionId,
      windowItems,
      prediction,
    }

    const updatePredTableRes = await ddb
      .put({
        TableName: MODEL_PREDICTION_TABLE,
        Item: {
          Id: executionId,
          windowItems,
          prediction,
          templateId: modelTrainingExecution.templateId,
          createdAt: Date.now(),
          trainingEndDate: trainingEndTimestamp,
        },
      })
      .promise()

    console.log(`Successfully saved response object to ${MODEL_PREDICTION_TABLE} table.`)

    return success(responseObj)
  } catch (err) {
    console.error(`Error invoking model endpoint :: ${JSON.stringify(err)}`, err)

    return fail({ message: `Error invoking model endpoint :: ${err}` })
  }
}

exports.handler = handler
