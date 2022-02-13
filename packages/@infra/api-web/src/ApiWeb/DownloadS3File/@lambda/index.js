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

const s3 = new aws.S3()

const ASSET_BUCKET_NAME = process.env.ASSET_BUCKET_NAME
const ASSET_BUCKET_KEYPREFIX = process.env.ASSET_BUCKET_KEYPREFIX

const handler = async (event) => {
  const type = event.pathParameters ? event.pathParameters.type : undefined
  const value = event.pathParameters ? event.pathParameters.value : undefined

  if (type == null || value == null) {
    return {
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      statusCode: 404,
    }
  }

  const Key = `${ASSET_BUCKET_KEYPREFIX}/${value}.${type}`

  console.debug(`Requesting to download ${Key}`)

  const file = await s3
    .getObject({
      Bucket: ASSET_BUCKET_NAME,
      Key,
    })
    .promise()

  return {
    headers: {
      'Content-Type': 'application/json',
      'Content-disposition': `attachment; filename=${value}.${type}`,
      'Access-Control-Allow-Origin': '*',
    },
    statusCode: 200,
    body: JSON.stringify({
      data: file.Body.toString('base64'),
      filename: `${value}.${type}`,
    }),
    isBase64Encoded: true,
  }
}

exports.handler = handler
