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
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { fromIni } from '@aws-sdk/credential-provider-ini'
import config from 'config'
import dayjs from 'dayjs'
import { debug as debugFn } from 'debug'
import neatCsv from 'neat-csv'
import fs from 'fs'
import path from 'path'

const debug = debugFn('app')
debug.log = console.log.bind(console)

export class DataImportApp {
  readonly s3Client: S3Client

  readonly ddbClient: DynamoDBClient

  readonly bucket: string

  readonly bucketKeyPrefix: string

  readonly assetsDDBTableName: string

  constructor() {
    const region = config.get<string>('region')
    const profile = config.get<string>('profile')
    this.bucket = config.get<string>('bucket')
    this.bucketKeyPrefix = config.get<string>('bucketKeyPrefix')
    this.assetsDDBTableName = config.get<string>('assetsDDBTableName')

    const credentials = fromIni({ profile })
    this.s3Client = new S3Client({ credentials, region })
    this.ddbClient = new DynamoDBClient({ credentials, region })
  }

  async importCsvFiles(): Promise<void> {
    const assetsDir = config.get<string>('assetsDir')
    const classfile = config.get<string>('classfile')

    const { assetClasses, companyNames } = await this.loadAssetClassData(classfile)

    for (const ticker in assetClasses) {
      try {
        await this.loadCsvToCloud(
          path.join(assetsDir, `${ticker}.csv`),
          ticker,
          assetClasses[ticker],
          companyNames[ticker],
        )
      } catch (err) {
        console.error(`Error while loading data for ${ticker}. Skipping`)
      }
    }
  }

  async loadAssetClassData(
    classfilePath: string,
  ): Promise<{ assetClasses: Record<string, string>; companyNames: Record<string, string> }> {
    try {
      debug(`Parsing asset classes file (${classfilePath})...`)
      const fileContent = fs.readFileSync(classfilePath, { encoding: 'utf-8' })
      const assetClassData = await neatCsv(fileContent, {
        mapHeaders: ({ header }: { header: string }): any => {
          return header.trim()
        },
        mapValues: ({ value }: { header: string; value: string }): any => {
          return value.trim()
        },
      })

      const assetClasses: Record<string, string> = {}
      const companyNames: Record<string, string> = {}
      assetClassData.forEach((curr) => {
        assetClasses[curr.Symbol] = curr.Industry
        companyNames[curr.Symbol] = curr.Company
      })
      debug(`Parsed ${assetClassData.length} asset classes`)

      return { assetClasses, companyNames }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  isEmpty(str: string): boolean {
    return str == null || str === ''
  }

  async loadCsvToCloud(csvFilePath: string, ticker: string, assetClass: string, companyName: string): Promise<void> {
    try {
      debug(`Uploading asset data to ${this.bucket}/${this.bucketKeyPrefix}/${ticker}.csv`)
      const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' })
      const csvData = await neatCsv(fileContent)

      const lines = []
      lines.push('Date,Close')

      for (const row of csvData) {
        // if value not available -> skip
        if (!this.isEmpty(row.Close)) {
          lines.push(`${row.Date},${row.Close}`)
        }
      }

      const data = lines.join('\n')

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `${this.bucketKeyPrefix}/${ticker}.csv`,
          Body: data,
        }),
      )

      debug(`Updating asset metadata dynamodb table for ${ticker}`)
      await this.ddbClient.send(
        new PutCommand({
          TableName: this.assetsDDBTableName,
          Item: {
            Id: ticker,
            ticker: ticker,
            assetClass,
            description: companyName,
            startDate: dayjs(csvData[0].Date).valueOf(),
            endDate: dayjs(csvData[csvData.length - 1].Date).valueOf(),
            dataRows: csvData.length,
            bucketKey: `${this.bucketKeyPrefix}/${ticker}.csv`,
            bucketName: this.bucket,
          },
        }),
      )

      debug('Loading CSVs into S3 and DynamoDB done.')
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}
