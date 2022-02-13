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

import { dayjslocal, dayjsutc } from '../utils/dayjs'
import { AssetData } from '../models'
import { appvars } from '../config'
import { CrudService } from './base/crudService'
import { API } from 'aws-amplify'
import axios from 'axios'

interface PresigendPostData {
  url: string
  fields: Record<string, string>
}

export class AssetService extends CrudService<AssetData> {
  private async getPresignedUrl(ticker: string, operation: string): Promise<string | PresigendPostData> {
    try {
      const response: any = await API.post(appvars.BACKENDVARS.API_DS_NAME, `/${this.endpoint}/get-presigned-url`, {
        body: {
          filename: `${ticker}.csv`,
          ticker,
          operation,
        },
      })

      return response
    } catch (err) {
      console.error(`[api::${this.serviceName}::get-presigned-url] Error while request`, err)
      throw err
    }
  }

  async getS3UploadUrl(ticker: string): Promise<PresigendPostData> {
    return this.getPresignedUrl(ticker, 'putObject') as Promise<PresigendPostData>
  }

  async getS3DownloadUrl(ticker: string): Promise<string> {
    return this.getPresignedUrl(ticker, 'getObject') as Promise<string>
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async uploadToS3(uploadParams: any, file: File): Promise<any> {
    try {
      const formdata = new FormData()
      for (const key in uploadParams.fields) {
        formdata.append(key, uploadParams.fields[key])
      }
      formdata.append('file', file)
      const uploadResp = await axios.post(uploadParams.url, formdata, {
        withCredentials: false,
      })

      return uploadResp
    } catch (err) {
      console.error(`[api::${this.serviceName}::upload-s3] Error while request`, err)
      throw err
    }
  }
}

const AssetServiceInstance = new AssetService('asset', appvars.ENDPOINT.ASSET, {
  listHook: (items: AssetData[]): AssetData[] => {
    items.forEach((v) => {
      if (v.startDate != null) {
        v.startDateStr = dayjslocal(v.startDate).format(appvars.DATEFORMAT)
      }

      if (v.endDate != null) {
        v.endDateStr = dayjslocal(v.endDate).format(appvars.DATEFORMAT)
      }
    })

    return items
  },
})

export default AssetServiceInstance
