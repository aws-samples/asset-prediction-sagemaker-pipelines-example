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
import { useHistory } from 'react-router-dom'
import { useModelTrainingExecutionContext } from '../../../contexts/ModelTrainingExecutionContext'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { appvars } from '../../../config'
import { columnDefinitions } from './table-columns'

export const TrainingInstanceList: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: modelTrainingExecutionItems, isLoading }, { refreshItems }] = useModelTrainingExecutionContext()
  const [{ items: trainingTemplateItems }] = useTrainingTemplateContext()
  const [templateNames, setTemplateNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const initialObj: Record<string, string> = {}
    const _templateNames: Record<string, string> = trainingTemplateItems.reduce(
      (obj, curr) => ({
        ...obj,
        [curr.Id]: curr.name,
      }),
      initialObj,
    )
    setTemplateNames(_templateNames)
  }, [trainingTemplateItems, modelTrainingExecutionItems])

  const onCreateClick = () => {
    history.push(`/${appvars.URL.MODEL_TRAINING_EXECUTION}/new`)
  }

  const onRefreshClick = async () => {
    refreshItems()
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onCreateClick} variant='primary'>
        Create model training execution
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Model training executions'}
      columnDefinitions={columnDefinitions(templateNames)}
      items={modelTrainingExecutionItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[{ id: 'createdAt', desc: true }]}
      pageSizes={[25, 50, 100]}
      rowCount={modelTrainingExecutionItems.length}
    />
  )
}
