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

const MODEL_PREDICTION_TABLE = process.env.MODEL_PREDICTION_TABLE
const FEATURE_IMPORTANCE_DDB_TABLE = process.env.FEATURE_IMPORTANCE_DDB_TABLE
const NAME = process.env.MANAGER_NAME

const ddbClient = new aws.DynamoDB.DocumentClient()

const transformFIItem = (fiItem) => {
  const { featureImportance: fiStr, byAssetClass: byAssetClassStr } = fiItem.data
  const fi = JSON.parse(fiStr)
  const byAssetClass = JSON.parse(byAssetClassStr)

  const fiData = []
  for (const key in fi.feature) {
    if (fi.feature[key] == null || fi.importance[key] == null) {
      continue
    }

    const ticker = fi.feature[key]
    const importance = parseFloat(fi.importance[key])

    if (importance === 0.0) {
      continue
    }

    fiData.push({ ticker, importance })
  }

  const assetClassImportance = []
  for (const key in byAssetClass.asset_class) {
    if (byAssetClass.asset_class[key] == null || byAssetClass.importance[key] == null) {
      continue
    }

    const name = byAssetClass.asset_class[key]
    const importance = parseFloat(byAssetClass.importance[key])
    assetClassImportance.push({ name, importance })
  }

  fiData.sort((a, b) => b.importance - a.importance)
  assetClassImportance.sort((a, b) => b.importance - a.importance)

  return { featureImportance: fiData, assetClassImportance }
}

const handler = async (event) => {
  const entityId = event.pathParameters ? event.pathParameters[`${NAME}Id`] : undefined
  console.log(`:: ${NAME}-manager :: GET :: ${NAME}Id = ${entityId}`)

  try {
    let result

    // list all
    if (entityId === undefined) {
      console.debug(`:: ${NAME}-manager :: GET :: retrieving all ${NAME}s`)
      const modelPredictionResult = await ddbClient.scan({ TableName: MODEL_PREDICTION_TABLE }).promise()
      const featureImportanceResult = await ddbClient.scan({ TableName: FEATURE_IMPORTANCE_DDB_TABLE }).promise()

      const { Items: modelPredictionItems } = modelPredictionResult
      const { Items: featureImportanceItems } = featureImportanceResult

      for (const prLogItem of modelPredictionItems) {
        const fiItem = featureImportanceItems.find((x) => x.Id === prLogItem.Id)

        if (fiItem != null) {
          prLogItem.importance = transformFIItem(fiItem)
        }
      }

      result = { Items: modelPredictionItems }
    } else {
      console.debug(`:: ${NAME}-manager :: retrieving ${NAME}`)
      const modelPredictionResult = await ddbClient
        .get({
          TableName: MODEL_PREDICTION_TABLE,
          Key: { Id: entityId },
        })
        .promise()

      const featureImportanceResult = await ddbClient
        .get({
          TableName: FEATURE_IMPORTANCE_DDB_TABLE,
          Key: { Id: entityId },
        })
        .promise()

      const { Item: prLogItem } = modelPredictionResult
      const { Item: fiItem } = featureImportanceResult

      if (fiItem != null) {
        prLogItem.importance = transformFIItem(fiItem)
      }

      result = { Item: prLogItem }
    }

    console.debug(`:: ${NAME}-manager :: result :: ${JSON.stringify(result)}`)

    return success({ data: result })
  } catch (err) {
    console.error(`There was an error while retrieving ${NAME}s: ${JSON.stringify(err)}`)

    return fail({ error: err })
  }
}

exports.handleGET = handler
