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
import Icon from 'aws-northstar/components/Icon'
import { dayjslocal } from '../../../utils/dayjs'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { EndpointStatus, ModelTrainingExecutionData } from '../../../models'
import { getStatusBadge } from '../../../utils/badge-helper'

export const columnDefinitions = (templateNames: Record<string, string>): Column<ModelTrainingExecutionData>[] => [
  {
    id: 'Id',
    width: 300,
    Header: 'ID',
    accessor: 'Id',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { Id } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.MODEL_TRAINING_EXECUTION}/${Id}`}>
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
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
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
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'updatedAt',
    width: 160,
    Header: 'Updated',
    accessor: 'updatedAt',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { updatedAt } = row.original

        if (updatedAt == null) {
          return null
        }

        return dayjslocal(updatedAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'pipelineExecStatus',
    width: 150,
    Header: 'Pipeline status',
    accessor: 'pipelineExecStatusChanges',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { pipelineExecStatusChanges } = row.original

        if (pipelineExecStatusChanges == null) {
          return null
        }

        const lastItem = pipelineExecStatusChanges[pipelineExecStatusChanges.length - 1]

        return getStatusBadge(lastItem.currentPipelineExecutionStatus)
      }
    },
  },
  {
    id: 'pipelineStepStatus',
    width: 200,
    Header: 'Current step',
    accessor: 'pipelineStepStatusChanges',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { pipelineStepStatusChanges } = row.original

        if (pipelineStepStatusChanges == null) {
          return null
        }

        const lastItem = pipelineStepStatusChanges[pipelineStepStatusChanges.length - 1]

        return `${lastItem.stepType} / ${lastItem.currentStepStatus}`
      }
    },
  },
  {
    id: 'modelAssigned',
    width: 150,
    Header: 'Model assigned',
    accessor: 'modelInfo',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { modelInfo } = row.original

        if (modelInfo == null) {
          return <Icon name='RadioButtonUnchecked' />
        }

        return <Icon name='RadioButtonChecked' />
      }
    },
  },
  {
    id: 'modelEndpoint',
    width: 150,
    Header: 'Model endpoint active',
    accessor: 'modelInfo',
    Cell: ({ row }: Cell<ModelTrainingExecutionData>): any => {
      if (row && row.original) {
        const { modelInfo } = row.original

        if (
          modelInfo == null ||
          modelInfo.endpointArn == null ||
          modelInfo.endpointStatus !== EndpointStatus.InService
        ) {
          return <Icon name='RadioButtonUnchecked' />
        }

        return <Icon name='RadioButtonChecked' />
      }
    },
  },
]
