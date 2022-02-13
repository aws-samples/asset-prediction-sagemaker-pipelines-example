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

import { dayjslocal } from '../../../utils/dayjs'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { ExecStatusChange, StepStatusChange, ProcessingStepLog } from '../../../models'
import { getStatusBadge } from '../../../utils/badge-helper'

type LevelColorType = 'grey' | 'red' | 'blue' | 'green' | undefined

export const columnDefinitions: Column<ProcessingStepLog>[] = [
  {
    id: 'at',
    width: 180,
    Header: 'At',
    accessor: 'at',
    Cell: ({ row }: Cell<ProcessingStepLog>): any => {
      if (row && row.original) {
        const { at } = row.original

        return dayjslocal(at).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'level',
    width: 100,
    Header: 'Level',
    accessor: 'level',
    Cell: ({ row }: Cell<ProcessingStepLog>): any => {
      if (row && row.original) {
        const { level } = row.original

        return getStatusBadge(level)
      }
    },
  },
  {
    id: 'msg',
    width: 1000,
    Header: 'Message',
    accessor: 'msg',
  },
]

export const execColumnDefinitions: Column<ExecStatusChange>[] = [
  {
    id: 'executionStartTime',
    width: 200,
    Header: 'Start time',
    accessor: 'executionStartTime',
  },
  {
    id: 'executionEndTime',
    width: 300,
    Header: 'End time',
    accessor: 'executionEndTime',
  },
  {
    id: 'previousPipelineExecutionStatus',
    width: 200,
    Header: 'Previous Status',
    accessor: 'previousPipelineExecutionStatus',
    Cell: ({ row }: Cell<ExecStatusChange>): any => {
      if (row && row.original) {
        const { previousPipelineExecutionStatus } = row.original

        if (previousPipelineExecutionStatus == null) {
          return null
        }

        return getStatusBadge(previousPipelineExecutionStatus)
      }
    },
  },
  {
    id: 'currentPipelineExecutionStatus',
    width: 200,
    Header: 'Current Status',
    accessor: 'currentPipelineExecutionStatus',
    Cell: ({ row }: Cell<ExecStatusChange>): any => {
      if (row && row.original) {
        const { currentPipelineExecutionStatus } = row.original

        if (currentPipelineExecutionStatus == null) {
          return null
        }

        return getStatusBadge(currentPipelineExecutionStatus)
      }
    },
  },
]

export const stepColumnDefinitions: Column<StepStatusChange>[] = [
  {
    id: 'stepStartTime',
    width: 200,
    Header: 'Start time',
    accessor: 'stepStartTime',
  },
  {
    id: 'stepEndTime',
    width: 300,
    Header: 'End time',
    accessor: 'stepEndTime',
  },
  {
    id: 'previousStepStatus',
    width: 200,
    Header: 'Previous status',
    accessor: 'previousStepStatus',
    Cell: ({ row }: Cell<StepStatusChange>): any => {
      if (row && row.original) {
        const { previousStepStatus } = row.original

        if (previousStepStatus == null) {
          return null
        }

        return getStatusBadge(previousStepStatus)
      }
    },
  },
  {
    id: 'currentStepStatus',
    width: 200,
    Header: 'Current status',
    accessor: 'currentStepStatus',
    Cell: ({ row }: Cell<StepStatusChange>): any => {
      if (row && row.original) {
        const { currentStepStatus } = row.original

        if (currentStepStatus == null) {
          return null
        }

        return getStatusBadge(currentStepStatus)
      }
    },
  },
  {
    id: 'stepType',
    width: 250,
    Header: 'Step type',
    accessor: 'stepType',
  },
]
