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
const MODEL_ENDPOINT_ARN_INDEX = process.env.MODEL_ENDPOINT_ARN_INDEX

const ddb = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  console.log(`:: model endpoint state change handler :: ${JSON.stringify(event)}`)

  const { EndpointName, EndpointArn, EndpointStatus, CreationTime, LastModifiedTime } = event.detail

  if (EndpointArn == null) {
    console.warn('EndpointArn is not present in the payload. Skipping...')

    return
  }

  // TODO:
  // retrieve item from modelEndpointMaintenance table
  // update status in both tables

  try {
    const modelEndpointMaintenanceResp = await ddb
      .query({
        TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
        IndexName: MODEL_ENDPOINT_ARN_INDEX,
        KeyConditionExpression: 'endpointArn = :endpointArn',
        ExpressionAttributeValues: {
          ':endpointArn': EndpointArn,
        },
      })
      .promise()

    const modelEndpointItem = modelEndpointMaintenanceResp.Items[0]
    console.log(
      `Successfully retreived modelEndpointMaintenance item with id ${modelEndpointItem.Id} based on endpointArn ${EndpointArn}`,
    )

    if (EndpointStatus === 'DELETED' || EndpointStatus === 'DELETING') {
      const deleteEndpointItemRes = await ddb
        .delete({
          TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
          Key: {
            Id: modelEndpointItem.Id,
          },
        })
        .promise()

      console.log(`Successfully deleted endpoint in ${MODEL_ENDPOINT_MAINTENANCE_TABLE} table`, deleteEndpointItemRes)

      const deleteEndpointDdbRes = await ddb
        .update({
          TableName: MODEL_TRAINING_EXECUTION_TABLE,
          Key: { Id: modelEndpointItem.Id },
          UpdateExpression:
            'REMOVE #modelInfo.#endpointArn, #modelInfo.#endpointConfigArn, #modelInfo.#endpointStatus, #modelInfo.#endpointName SET #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#modelInfo': 'modelInfo',
            '#endpointArn': 'endpointArn',
            '#endpointStatus': 'endpointStatus',
            '#endpointName': 'endpointName',
            '#endpointConfigArn': 'endpointConfigArn',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':updatedAt': Date.now(),
          },
        })
        .promise()

      console.log(`Successfully updated modelInfo in training instance ${modelEndpointItem.Id}`, deleteEndpointDdbRes)

      return
    }

    const modelEndpointUpdateResp = await ddb
      .update({
        TableName: MODEL_ENDPOINT_MAINTENANCE_TABLE,
        Key: {
          Id: modelEndpointItem.Id,
        },
        UpdateExpression:
          'SET #endpointStatus = :endpointStatus, #creationTime = :creationTime, #lastModifiedTime = :lastModifiedTime',
        ExpressionAttributeNames: {
          '#endpointStatus': 'endpointStatus',
          '#creationTime': 'creationTime',
          '#lastModifiedTime': 'lastModifiedTime',
        },
        ExpressionAttributeValues: {
          ':endpointStatus': EndpointStatus,
          ':creationTime': CreationTime,
          ':lastModifiedTime': LastModifiedTime,
        },
      })
      .promise()

    console.log(
      `Successfully updated modelEndpointMaintenance item with id ${modelEndpointItem.Id}`,
      modelEndpointUpdateResp,
    )

    const updateResp = await ddb
      .update({
        TableName: MODEL_TRAINING_EXECUTION_TABLE,
        Key: {
          Id: modelEndpointItem.Id,
        },
        UpdateExpression: 'SET #modelInfo.#endpointStatus = :endpointStatus, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#modelInfo': 'modelInfo',
          '#endpointStatus': 'endpointStatus',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':endpointStatus': EndpointStatus,
          ':updatedAt': Date.now(),
        },
      })
      .promise()

    console.log(`Successfully updated training instance with id ${modelEndpointItem.Id}`, updateResp)
  } catch (err) {
    console.error(
      `Error retreiving/updating training instance/modelEndpointMaintenance item from DDB :: ${JSON.stringify(err)}`,
      err,
    )
  }
}

exports.handler = handler
