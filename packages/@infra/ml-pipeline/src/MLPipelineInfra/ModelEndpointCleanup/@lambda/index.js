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
const MODEL_ENDPOINT_MAINTENANCE_TABLE = process.env.MODEL_ENDPOINT_MAINTENANCE_TABLE
const EXPIRY_TIME_IN_MINS = parseInt(process.env.EXPIRY_TIME_IN_MINS, 10)

const EXPIRY_TIME_IN_MS = EXPIRY_TIME_IN_MINS * 60 * 1000

const ddb = new aws.DynamoDB.DocumentClient()
const sagemaker = new aws.SageMaker()

const cleanupEndpoint = async (modelEndpoint) => {
  console.log(`Endpoint to be removed: ${JSON.stringify(modelEndpoint)}`)

  try {
    const deleteEndpointRes = await sagemaker.deleteEndpoint({ EndpointName: modelEndpoint.endpointName }).promise()

    console.log(`Successfully deleted endpoint ${modelEndpoint.endpointName}`, deleteEndpointRes)
  } catch (err) {
    console.error(`:: model-endpoint-cleanup :: There was an error while deleting endpoint: ${JSON.stringify(err)}`)

    throw err
  }

  try {
    const deleteEndpointConfigRes = await sagemaker
      .deleteEndpointConfig({ EndpointConfigName: modelEndpoint.endpointConfigName })
      .promise()

    console.log(`Successfully deleted endpoint config ${modelEndpoint.endpointConfigArn}`, deleteEndpointConfigRes)
  } catch (err) {
    console.error(
      `:: model-endpoint-cleanup :: There was an error while deleting endpoint config: ${JSON.stringify(err)}`,
    )

    throw err
  }
  // remove from ddb --> happens in modelEndpointStateChangeHandler
}

const handler = async (event) => {
  console.log(`:: model endpoint cleanup :: ${JSON.stringify(event)}`)

  try {
    const modelEndpointMaintenanceResp = await ddb
      .scan({
        TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
      })
      .promise()

    const modelEndpoints = modelEndpointMaintenanceResp.Items
    const NOW = Date.now()

    for (const modelEndpoint of modelEndpoints) {
      const { endpointStatus, lastModifiedTime, lastInvokeTime } = modelEndpoint

      if (lastInvokeTime == null) {
        if (lastModifiedTime + EXPIRY_TIME_IN_MS < NOW) {
          await cleanupEndpoint(modelEndpoint)
        }
      } else if (lastModifiedTime + EXPIRY_TIME_IN_MS < NOW && lastInvokeTime + EXPIRY_TIME_IN_MS < NOW) {
        await cleanupEndpoint(modelEndpoint)
      }
    }
  } catch (err) {
    console.error(`Error cleaning up model endpoint :: ${JSON.stringify(err)}`, err)
  }
}

exports.handler = handler
