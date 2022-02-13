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
const { exec } = require('child_process')
const { success, fail } = require('/opt/lambda-utils')

const MODEL_TRAINING_EXECUTION_TABLE = process.env.MODEL_TRAINING_EXECUTION_TABLE
const MODEL_ENDPOINT_MAINTENANCE_TABLE = process.env.MODEL_ENDPOINT_MAINTENANCE_TABLE

const sagemaker = new aws.SageMaker()
const ddbClient = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  const executionId = event.pathParameters ? event.pathParameters.executionId : undefined
  console.log(` :: delete-model-endpoint :: DELETE :: executionId = ${executionId}`)

  // no id parameter
  if (executionId === undefined) {
    console.error(' :: delete-model-endpoint :: DELETE :: executionId not specified')

    return fail({ error: 'no executionId set' })
  } else {
    let modelTrainingExecution = null
    try {
      const modelTrainingExecutionRes = await ddbClient
        .get({
          TableName: MODEL_TRAINING_EXECUTION_TABLE,
          Key: {
            Id: executionId,
          },
        })
        .promise()

      modelTrainingExecution = modelTrainingExecutionRes.Item
    } catch (err) {
      console.error(` :: delete-model-endpoint :: DELETE :: error retreiving training instance (id: ${executionId})`)

      return fail({ message: `Error retreiving training instance with id ${executionId}` })
    }

    const { endpointConfigArn, endpointArn, endpointName } = modelTrainingExecution.modelInfo

    try {
      const deleteEndpointRes = await sagemaker
        .deleteEndpoint({
          EndpointName: endpointName,
        })
        .promise()

      console.log(`Successfully deleted endpoint ${endpointName} (${endpointArn})`, deleteEndpointRes)
    } catch (err) {
      console.error(
        `:: delete-model-endpoint :: DELETE :: There was an error while deleting endpoint: ${JSON.stringify(err)}`,
      )

      return fail({ error: err })
    }

    try {
      const deleteEndpointConfigRes = await sagemaker
        .deleteEndpointConfig({
          EndpointConfigName: `config-${executionId}`,
        })
        .promise()

      console.log(`Successfully deleted endpoint config ${endpointConfigArn}`, deleteEndpointConfigRes)
    } catch (err) {
      console.error(
        `:: delete-model-endpoint :: DELETE :: There was an error while deleting endpoint config: ${JSON.stringify(
          err,
        )}`,
      )

      return fail({ error: err })
    }

    try {
      const ddbUpdateRes = await ddbClient
        .update({
          TableName: MODEL_TRAINING_EXECUTION_TABLE,
          Key: {
            Id: executionId,
          },
          UpdateExpression: 'SET #modelInfo.#endpointStatus = :endpointStatus, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#modelInfo': 'modelInfo',
            '#endpointStatus': 'endpointStatus',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':endpointStatus': 'DELETING',
            ':updatedAt': Date.now(),
          },
          ReturnValues: 'ALL_NEW',
        })
        .promise()

      console.log(`Successfully updated modelInfo in training instance ${executionId}`, ddbUpdateRes)
    } catch (err) {
      console.error(
        `:: delete-model-endpoint :: DELETE :: There was an error while updating training instance modelInfo in ddb: ${JSON.stringify(
          err,
        )}`,
      )

      return fail({ error: err })
    }

    return success()
  }
}

exports.handleDELETE = handler
