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
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { AssetData } from '../../../models'

export const columnDefinitions: Column<AssetData>[] = [
  {
    id: 'ticker',
    width: 300,
    Header: 'Ticker',
    accessor: 'ticker',
    Cell: ({ row }: Cell<AssetData>): any => {
      if (row && row.original) {
        const { ticker } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.ASSET}/${ticker}`}>
            {ticker}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'assetClass',
    width: 250,
    Header: 'Asset Class',
    accessor: 'assetClass',
  },
  {
    id: 'description',
    width: 400,
    Header: 'Description',
    accessor: 'description',
  },
  {
    id: 'startDate',
    width: 150,
    Header: 'Start date',
    accessor: 'startDateStr',
  },
  {
    id: 'endDate',
    width: 150,
    Header: 'End date',
    accessor: 'endDateStr',
  },
  {
    id: 'dataRows',
    width: 80,
    Header: 'Data rows',
    accessor: 'dataRows',
  },
]
