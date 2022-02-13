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

const MODEL_TRAINING_EXECUTION_TABLE = process.env.MODEL_TRAINING_EXECUTION_TABLE
const MODEL_ENDPOINT_MAINTENANCE_TABLE = process.env.MODEL_ENDPOINT_MAINTENANCE_TABLE

const sagemaker = new aws.SageMaker()
const ddb = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: create-model-endpoint :: POST :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: create-model-endpoint :: POST :: body :: ${JSON.stringify(body)}`)

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
    if (modelTrainingExecution != null && modelTrainingExecution.modelInfo == null) {
      return fail({
        message: 'No model is assigned to modelTrainingExecution. ' + 'Cannot create a model endpoint.',
      })
    }

    const { modelInfo } = modelTrainingExecution
    const endpointConfigName = `config-${modelTrainingExecution.Id}`
    const endpointName = `endpoint-${modelTrainingExecution.Id}`

    // create endpoint config
    const createEndpointConfigResult = await sagemaker
      .createEndpointConfig({
        EndpointConfigName: endpointConfigName,
        ProductionVariants: [
          {
            InitialInstanceCount: 1,
            InstanceType: 'ml.m5.large',
            ModelName: modelInfo.name,
            VariantName: 'variant-1',
          },
        ],
      })
      .promise()

    const { EndpointConfigArn } = createEndpointConfigResult

    const createModelEndpointResult = await sagemaker
      .createEndpoint({
        EndpointConfigName: endpointConfigName,
        EndpointName: endpointName,
      })
      .promise()

    const { EndpointArn } = createModelEndpointResult

    console.log(`Successfully created endpoint config (${EndpointConfigArn}) and model endpoint ${EndpointArn}`)

    const ddbUpdateRes = await ddb
      .update({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: executionId,
        },
        UpdateExpression:
          'SET #modelInfo.#endpointArn = :endpointArn, #modelInfo.#endpointConfigArn = :endpointConfigArn, #modelInfo.#endpointStatus = :endpointStatus, #modelInfo.#endpointName = :endpointName, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#modelInfo': 'modelInfo',
          '#endpointArn': 'endpointArn',
          '#endpointStatus': 'endpointStatus',
          '#endpointName': 'endpointName',
          '#endpointConfigArn': 'endpointConfigArn',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':endpointArn': EndpointArn,
          ':endpointStatus': 'CREATING',
          ':endpointName': endpointName,
          ':endpointConfigArn': EndpointConfigArn,
          ':updatedAt': Date.now(),
        },
        ReturnValues: 'ALL_NEW',
      })
      .promise()

    console.log(`Added EndpointArn (${EndpointArn}) to training instance's modelInfo: ${executionId}`, ddbUpdateRes)

    const ddbAddRes = await ddb
      .put({
        TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
        Item: {
          Id: executionId,
          endpointArn: EndpointArn,
          endpointName: endpointName,
          endpointConfigArn: EndpointConfigArn,
          endpointStatus: 'CREATING',
          endpointConfigName,
        },
      })
      .promise()

    console.log(`Added model endpoint data to ${MODEL_ENDPOINT_MAINTENANCE_TABLE}`, ddbUpdateRes)

    return success(ddbUpdateRes.Attributes)
  } catch (err) {
    console.error(`Error creating model endpoint :: ${JSON.stringify(err)}`, err)

    return fail({ message: `Error creating model endpoint :: ${err}` })
  }
}

exports.handlePOST = handler
