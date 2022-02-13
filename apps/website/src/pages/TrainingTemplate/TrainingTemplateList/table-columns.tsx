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

import { Link } from 'aws-northstar'
import { dayjslocal, dayjsutc } from '../../../utils/dayjs'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { TrainingTemplateData } from '../../../models'

export const columnDefinitions: Column<TrainingTemplateData>[] = [
  {
    id: 'Id',
    width: 300,
    Header: 'ID',
    accessor: 'Id',
  },
  {
    id: 'name',
    width: 450,
    Header: 'Name',
    accessor: 'name',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const { Id, name } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.TRAINING_TEMPLATE}/${Id}`}>
            {name}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'predictedAsset',
    width: 200,
    Header: 'Predicted Asset',
    accessor: 'predictedAsset',
  },
  {
    id: 'createdAt',
    width: 150,
    Header: 'Created',
    accessor: 'createdAt',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'updatedAt',
    width: 150,
    Header: 'Updated',
    accessor: 'updatedAt',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const { updatedAt } = row.original

        return dayjslocal(updatedAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'assetsForTA',
    width: 250,
    Header: 'TA assets',
    accessor: 'feMeta',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const {
          feMeta: { taSettings },
        } = row.original

        return taSettings.assets.join(', ')
      }

      return row.id
    },
  },
  {
    id: 'assetsForArima',
    width: 150,
    Header: 'Arima assets',
    accessor: 'feMeta',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const {
          feMeta: { arimaSettings },
        } = row.original

        return arimaSettings.assets.join(', ')
      }

      return row.id
    },
  },
  {
    id: 'assetClassesForFFT',
    width: 150,
    Header: 'FFT classes',
    accessor: 'feMeta',
    Cell: ({ row }: Cell<TrainingTemplateData>): any => {
      if (row && row.original) {
        const {
          feMeta: { fftSettings },
        } = row.original

        return fftSettings.assetClasses.join(', ')
      }

      return row.id
    },
  },
]
