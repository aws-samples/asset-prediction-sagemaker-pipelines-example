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

const s3 = new aws.S3()

const ASSET_BUCKET_NAME = process.env.ASSET_BUCKET_NAME
const ASSET_BUCKET_KEYPREFIX = process.env.ASSET_BUCKET_KEYPREFIX

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: getS3PresignedUrl :: POST :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: getS3PresignedUrl :: POST :: body :: ${JSON.stringify(body)}`)

  let { filename, ticker, operation } = body
  const Key = `${ASSET_BUCKET_KEYPREFIX}/${filename}`

  if (operation == null) {
    operation = 'putObject'
  }

  try {
    switch (operation) {
      case 'putObject': {
        const data = await new Promise((resolve, reject) => {
          s3.createPresignedPost(
            {
              Bucket: ASSET_BUCKET_NAME,
              Fields: {
                key: Key,
              },
              Conditions: [
                ['eq', '$x-amz-meta-ticker', ticker],
                ['eq', '$Content-Type', 'text/csv'],
              ],
              Expires: 300, // 5 minutes
            },
            (err, data) => {
              if (err) {
                reject(err)
              } else {
                data.fields['x-amz-meta-ticker'] = ticker
                resolve(data)
              }
            },
          )
        })

        return success(data)
      }

      case 'getObject': {
        const presignedUrl = s3.getSignedUrl(operation, {
          Bucket: ASSET_BUCKET_NAME,
          Key,
          Expires: 300, // 5 minutes
        })

        return success(presignedUrl)
      }
      default:
        return fail({ message: `${operation} operation not supported.` })
    }
  } catch (err) {
    console.error('Error while getting presigned URL', err)

    return fail(err)
  }
}

exports.handler = handler
