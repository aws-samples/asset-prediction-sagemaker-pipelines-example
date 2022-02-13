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

import { Link, Checkbox } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'
import { ModelPredictionData } from '../../../models'

export const columnDefinitions = (templateNames: Record<string, string>): Column<ModelPredictionData>[] => [
  {
    id: 'Id',
    width: 300,
    Header: 'ID',
    accessor: 'Id',
    Cell: ({ row }: Cell<ModelPredictionData>): any => {
      if (row && row.original) {
        const { Id } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.MODEL_PREDICTION}/${Id}`}>
            {Id}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'template',
    width: 250,
    Header: 'Template',
    accessor: 'templateId',
    Cell: ({ row }: Cell<ModelPredictionData>): any => {
      if (row && row.original) {
        const { templateId } = row.original

        if (templateNames[templateId] != null) {
          return templateNames[templateId]
        }
      }

      return row.id
    },
  },
  {
    id: 'createdAt',
    width: 160,
    Header: 'Created',
    accessor: 'createdAt',
    Cell: ({ row }: Cell<ModelPredictionData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'windowItems',
    width: 160,
    Header: 'Data series (count)',
    accessor: 'windowItems',
    Cell: ({ row }: Cell<ModelPredictionData>): any => {
      if (row && row.original) {
        const { windowItems } = row.original

        return windowItems.length
      }

      return row.id
    },
  },
  {
    id: 'importance',
    width: 160,
    Header: 'Feature importance',
    accessor: 'importance',
    Cell: ({ row }: Cell<ModelPredictionData>): any => {
      if (row && row.original) {
        const { importance } = row.original

        return <Checkbox checked={importance != null} />
      }

      return row.id
    },
  },
]
