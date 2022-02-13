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

import { Button, Inline, Table, ButtonIcon } from 'aws-northstar'
import { FunctionComponent, useState, useEffect } from 'react'
import { TrainingTemplateData } from '../../../models'
import { useModelPredictionContext } from '../../../contexts/ModelPredictionContext'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { columnDefinitions } from './table-columns'

export const PredictionLogList: FunctionComponent = () => {
  const [{ items: predicitionLogItems, isLoading }, { refreshItems, getItem }] = useModelPredictionContext()
  const [{ items: trainingTemplateItems }] = useTrainingTemplateContext()
  const [templateNames, setTemplateNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const initialObj: Record<string, string> = {}
    const _templateNames: Record<string, string> = trainingTemplateItems.reduce(
      (obj: Record<string, string>, curr: TrainingTemplateData) => ({
        ...obj,
        [curr.Id]: curr.name,
      }),
      initialObj,
    )
    setTemplateNames(_templateNames)
  }, [trainingTemplateItems, predicitionLogItems])

  const onRefreshClick = async () => {
    refreshItems()
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Model Predictions'}
      columnDefinitions={columnDefinitions(templateNames)}
      items={predicitionLogItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[{ id: 'createdAt', desc: true }]}
      pageSizes={[25, 50, 100]}
      rowCount={predicitionLogItems.length}
    />
  )
}
