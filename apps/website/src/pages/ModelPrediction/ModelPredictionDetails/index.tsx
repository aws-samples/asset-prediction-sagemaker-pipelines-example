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

import { FunctionComponent, useCallback, useState, useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Column,
  ColumnLayout,
  Container,
  Inline,
  KeyValuePair,
  Link,
  Stack,
  DeleteConfirmationDialog,
  Text,
  ButtonIcon,
  Tabs,
} from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import { useModelPredictionContext } from '../../../contexts/ModelPredictionContext'
import NotFound from '../../../components/NotFound'
import { appvars } from '../../../config'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { dayjslocal } from '../../../utils/dayjs'
import { Line, Bar } from 'react-chartjs-2'
// eslint-disable-next-line import/default
import Chart from 'kaktana-react-lightweight-charts'
import { randomChartColor } from '../../../utils/color-helper'
import { TrainingTemplateData, ModelPredictionData } from '../../../models'

const lineChartOptions = {
  parsing: {
    xAxisKey: 'date',
    yAxisKey: 'value',
  },
  scales: {
    yAxis: {
      // min: 0.0,
    },
  },
  aspectRatio: 3,
}

const chartOptionsLWC = {
  alignLabels: true,
  localization: {
    dateFormat: 'yyyy-MM-dd',
  },
  timeScale: {
    rightOffset: 120,
    barSpacing: 3,
    borderVisible: false,
    borderColor: '#fff000',
    visible: true,
    timeVisible: true,
    secondsVisible: false,
  },
}

export const ModelPredictionDetails: FunctionComponent = () => {
  const history = useHistory()
  const { modelPredictionId } = useParams<{ modelPredictionId: string }>()
  const [{ items: modelPredictionItems }, { deleteItem }] = useModelPredictionContext()
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('')
  const [{ items: trainingTemplateItems }] = useTrainingTemplateContext()
  const [colorTrigger, setColorTrigger] = useState<number>(Math.random())
  const currentItem: ModelPredictionData = modelPredictionItems.find(
    (_x: ModelPredictionData) => _x.Id === modelPredictionId,
  ) as ModelPredictionData

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [chartRange, setChartRange] = useState<{ from: number; to: number }>({
    from: Date.now(),
    to: Date.now(),
  })

  useEffect(() => {
    if (currentItem == null) {
      return
    }
    const initialObj: Record<string, string> = {}
    const templateNames: Record<string, string> = trainingTemplateItems.reduce(
      (obj: Record<string, string>, curr: TrainingTemplateData) => ({
        ...obj,
        [curr.Id]: curr.name,
      }),
      initialObj,
    )

    setCurrentTemplateName(templateNames[currentItem.templateId])
  }, [trainingTemplateItems, currentItem])

  const chartLineSeries = useMemo((): any => {
    if (currentItem == null) {
      return []
    }

    const ds = []

    ds.push({
      data: currentItem.windowItems.map((item) => ({
        time: item.date,
        value: item.value,
      })),
    })
    for (const key in currentItem.prediction) {
      const predictedData = currentItem.prediction[key]
      ds.push({
        data: predictedData.map((item) => ({
          time: item.date,
          value: item.value,
        })),
      })
    }

    if (currentItem.windowItems.length > 1) {
      setChartRange({
        from: dayjslocal(currentItem.windowItems[0].date).unix(),
        to: dayjslocal(currentItem.windowItems[currentItem.windowItems.length - 1].date).unix(),
      })
    }

    return ds
  }, [currentItem])

  const chartData = useMemo((): any => {
    if (currentItem == null) {
      return []
    }

    const x = colorTrigger
    const lineTension = 0.0

    const labelsSet = new Set()
    currentItem.windowItems.map((x) => x.date).forEach(labelsSet.add, labelsSet)

    const ds = []
    for (const key in currentItem.prediction) {
      const predictedData = currentItem.prediction[key]
      const color = randomChartColor()
      ds.push({
        label: `${key} quantile`,
        lineTension,
        data: predictedData,
        borderColor: color.border,
        backgroundColor: color.background,
      })
      predictedData.map((x) => x.date).forEach(labelsSet.add, labelsSet)
    }
    const labels = Array.from(labelsSet)
    labels.sort()

    const mainChartColor = randomChartColor()
    const _chartData = {
      labels,
      datasets: [
        {
          label: 'Original asset data',
          lineTension,
          data: currentItem.windowItems,
          backgroundColor: mainChartColor.background,
          borderColor: mainChartColor.border,
          fill: true,
        },
        ...ds,
      ],
    }

    return _chartData
  }, [currentItem, colorTrigger])

  const importanceChartData = useMemo((): any => {
    if (currentItem == null || currentItem.importance == null) {
      return {
        byIndividual: { labels: [], dataSets: [] },
        byClass: { labels: [], dataSets: [] },
      }
    }

    const indColor = randomChartColor()
    const classColor = randomChartColor()

    return {
      byIndividual: {
        labels: currentItem.importance.featureImportance.map((x) => x.ticker),
        datasets: [
          {
            label: 'Feature importance by asset',
            data: currentItem.importance.featureImportance.map((x) => x.importance),
            backgroundColor: indColor.background,
            borderColor: indColor.border,
            borderWidth: 1,
            fill: true,
          },
        ],
      },
      byClass: {
        labels: currentItem.importance.assetClassImportance.map((x) => x.name),
        datasets: [
          {
            label: 'Feature importance by asset class',
            data: currentItem.importance.assetClassImportance.map((x) => x.importance),
            backgroundColor: classColor.background,
            borderColor: classColor.border,
            borderWidth: 1,
          },
        ],
      },
    }
  }, [currentItem])

  const refreshColors = useCallback(() => {
    setColorTrigger(Math.random())
  }, [setColorTrigger])

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('ModelPredictionData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.MODEL_PREDICTION}`)
  }, [deleteItem, history, currentItem])

  if (currentItem == null) {
    return <NotFound what={'ModelPrediction'} backUrl={appvars.URL.MODEL_PREDICTION} />
  }

  const actionGroup = (
    <Inline>
      <Button onClick={refreshColors}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onDeleteClick}>Delete</Button>
    </Inline>
  )

  return (
    <>
      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteModal}
        title={`Delete ${currentItem.Id}`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{currentItem.Id}</b> prediction log?
            <br />
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container
        headingVariant='h3'
        title={currentItem.Id}
        subtitle={`Prediction log for ${currentItem.Id} training instance`}
        actionGroup={actionGroup}
      >
        <ColumnLayout>
          <Column key='col1'>
            <Stack>
              <KeyValuePair label='Id' value={currentItem.Id} />
            </Stack>
          </Column>
          <Column key='col2'>
            <Stack>
              <KeyValuePair
                label='Template'
                value={
                  <Link href={`/${appvars.URL.TRAINING_TEMPLATE}/${currentItem.templateId}`}>
                    {`${currentTemplateName} (${currentItem.templateId})`}
                  </Link>
                }
              />
            </Stack>
          </Column>
          <Column key='col3'>
            <Stack>
              <KeyValuePair label='Created' value={dayjslocal(currentItem.createdAt).format(appvars.DATETIMEFORMAT)} />
            </Stack>
          </Column>
          <Column key='col4'>
            <Stack>
              <KeyValuePair
                label='Prediction start'
                value={dayjslocal(currentItem.trainingEndDate).format(appvars.DATEFORMAT)}
              />
            </Stack>
          </Column>
        </ColumnLayout>
      </Container>

      <Container headingVariant='h3' title=''>
        <Tabs
          tabs={[
            {
              id: 'tradingviewChart',
              label: 'Lightweight charts',
              content: (
                <Box style={{ width: '100%' }}>
                  <Chart
                    options={chartOptionsLWC}
                    lineSeries={chartLineSeries}
                    autoWidth={true}
                    from={chartRange.from}
                    to={chartRange.to}
                  />
                </Box>
              ),
            },
            {
              id: 'chartjs',
              label: 'Chart.js',
              content: (
                <Box style={{ width: '100%' }}>
                  <Line data={chartData} options={lineChartOptions} />
                </Box>
              ),
            },
            {
              id: 'featureImportanceByAssets',
              label: 'Feature importance by assets',
              content: (
                <Box style={{ width: '100%' }}>
                  <Bar
                    data={importanceChartData.byIndividual}
                    options={{
                      // parsing: {
                      // 	xAxisKey: 'ticker',
                      // 	yAxisKey: 'importance',
                      // },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                        x: {
                          offset: true,
                        },
                      },
                    }}
                  />
                </Box>
              ),
            },
            {
              id: 'featureImportanceByClass',
              label: 'Feature importance by class',
              content: (
                <Box style={{ width: '100%' }}>
                  <Bar
                    data={importanceChartData.byClass}
                    options={{
                      // parsing: {
                      // 	xAxisKey: 'name',
                      // 	yAxisKey: 'importance',
                      // },
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                        x: {
                          offset: true,
                        },
                      },
                    }}
                  />
                </Box>
              ),
            },
          ]}
        />
      </Container>
    </>
  )
}
