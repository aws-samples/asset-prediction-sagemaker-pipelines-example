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

import { FunctionComponent, useCallback, useState, useEffect } from 'react'
import {
  Badge,
  Box,
  Button,
  Column,
  ColumnLayout,
  Container,
  Inline,
  KeyValuePair,
  Link,
  Stack,
  Text,
  DeleteConfirmationDialog,
  Tabs,
  Table,
  ButtonIcon,
  ExpandableSection,
  Form,
  Input,
  TokenGroup,
} from 'aws-northstar'
import { FormField } from '../../../components/NorthstarEx'
import { useHistory, useParams } from 'react-router-dom'
import { dayjslocal } from '../../../utils/dayjs'
import NotFound from '../../../components/NotFound'
import { useModelTrainingExecutionContext } from '../../../contexts/ModelTrainingExecutionContext'
import { appvars } from '../../../config'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { columnDefinitions, execColumnDefinitions, stepColumnDefinitions } from './table-columns'
import { getStatusBadge } from '../../../utils/badge-helper'
import { EndpointStatus, InvokeModelEndpointPayload, TrainingTemplateData } from '../../../models'
import { FEImages } from './FEImages'

export const ModelTrainingExecutionDetails: FunctionComponent = () => {
  const history = useHistory()
  const { modelTrainingExecutionId } = useParams<{ modelTrainingExecutionId: string }>()
  const [
    { items: modelTrainingExecutionItems },
    { deleteItem, startModelTraining, getItem, createModelEndpoint, deleteModelEndpoint, invokeModelEndpoint },
  ] = useModelTrainingExecutionContext()
  const [{ items: trainingTemplateItems }] = useTrainingTemplateContext()
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('')
  const currentItem = modelTrainingExecutionItems.find((x) => x.Id === modelTrainingExecutionId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [tempQuantile, setTempQuantile] = useState<number>(0.1)
  const [showDeleteEndpointModal, setShowDeleteEndpointModal] = useState<boolean>(false)
  const [invokeModelEndpointPayload, setInvokeModelEndpointPayload] = useState<InvokeModelEndpointPayload>({
    executionId: '',
    numSamples: 100,
    quantiles: [],
  })
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false)

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
    setInvokeModelEndpointPayload({
      executionId: currentItem.Id,
      quantiles: [0.1, 0.5, 0.9],
      numSamples: 100,
    })
  }, [trainingTemplateItems, modelTrainingExecutionItems, currentItem])

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const onRefreshClick = useCallback(async () => {
    if (currentItem == null) {
      return
    }
    getItem(currentItem.Id)
  }, [getItem, currentItem])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('ModelTrainingExecutionData is null')
    }

    history.push(`/${appvars.URL.MODEL_TRAINING_EXECUTION}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const onCreateModelEndpointClick = useCallback(async () => {
    if (currentItem == null) {
      return
    }

    createModelEndpoint(currentItem.Id)
  }, [createModelEndpoint, currentItem])

  const onModelEndpointDeleteClick = useCallback(() => {
    setShowDeleteEndpointModal(true)
  }, [])

  const onInvokeModelEndpointClick = useCallback(async () => {
    if (invokeModelEndpointPayload == null) {
      return
    }

    setPredictionLoading(true)
    await invokeModelEndpoint(invokeModelEndpointPayload)
    setPredictionLoading(false)
  }, [invokeModelEndpoint, invokeModelEndpointPayload])

  const proceedWithDeleteEndpoint = useCallback(async () => {
    if (currentItem == null) {
      return
    }

    await deleteModelEndpoint(currentItem.Id)
    setShowDeleteEndpointModal(false)
  }, [deleteModelEndpoint, currentItem])

  const onTrainModelClick = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('ModelTrainingExecutionData is null')
    }

    await startModelTraining(currentItem.Id)
  }, [currentItem, startModelTraining])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('ModelTrainingExecutionData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.MODEL_TRAINING_EXECUTION}`)
  }, [deleteItem, history, currentItem])

  if (currentItem == null) {
    return <NotFound what={'ModelTrainingExecution'} backUrl={appvars.URL.MODEL_TRAINING_EXECUTION} />
  }

  const actionGroup = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onDeleteClick}>Delete</Button>
      {(currentItem.modelTrainingExecutionStatus == null ||
        currentItem.modelTrainingExecutionStatus.execStatus === 'Failed') && (
        <Button variant='primary' onClick={onEditClick}>
          Edit details
        </Button>
      )}
      {(currentItem.modelTrainingExecutionStatus == null ||
        currentItem.modelTrainingExecutionStatus.execStatus === 'Failed') && (
        <Button variant='primary' onClick={onTrainModelClick}>
          Start model training
        </Button>
      )}
    </Inline>
  )

  const trainingTab = {
    id: 'trainingTab',
    label: 'Training',
    content: (
      <>
        <Container headingVariant='h4' title='Process Status'>
          <ColumnLayout>
            <Column key='col1'>
              <Stack>
                <KeyValuePair
                  label='Pipeline Status'
                  value={
                    currentItem.modelTrainingExecutionStatus != null
                      ? getStatusBadge(currentItem.modelTrainingExecutionStatus.execStatus)
                      : getStatusBadge('CREATED')
                  }
                />
              </Stack>
              <Stack>
                <KeyValuePair
                  label='Step Status'
                  value={
                    currentItem.modelTrainingExecutionStatus != null
                      ? `${currentItem.modelTrainingExecutionStatus.stepType} > ${currentItem.modelTrainingExecutionStatus.stepStatus}`
                      : null
                  }
                />
              </Stack>
            </Column>
            <Column key='col2'>
              <Stack>
                <KeyValuePair
                  label='Pipeline Execution ARN'
                  value={<Text variant='small'>{currentItem.pipelineExecutionArn}</Text>}
                />
              </Stack>
            </Column>
            <Column key='col3'>
              <Stack>
                <KeyValuePair
                  label='Training started'
                  value={
                    currentItem.modelTrainingExecutionStatus
                      ? dayjslocal(currentItem.modelTrainingExecutionStatus?.startTime).format(appvars.DATETIMEFORMAT)
                      : null
                  }
                />
              </Stack>
            </Column>
            <Column key='col4'>
              <Stack>
                <KeyValuePair
                  label='Training finished'
                  value={
                    currentItem.modelTrainingExecutionStatus?.endTime
                      ? dayjslocal(currentItem.modelTrainingExecutionStatus.endTime).format(appvars.DATETIMEFORMAT)
                      : null
                  }
                />
              </Stack>
            </Column>
          </ColumnLayout>
        </Container>

        <Container headingVariant='h4' title='Model Training Logs'>
          <>
            {currentItem.pipelineExecStatusChanges != null && (
              <ExpandableSection
                variant='container'
                expanded={true}
                header={
                  <>
                    <Text>Pipeline Execution Changes</Text>
                    <Box style={{ right: 16, position: 'absolute' }}>
                      <Badge content={currentItem.pipelineExecStatusChanges.length} />
                    </Box>
                  </>
                }
              >
                <Box style={{ width: '100%' }}>
                  <Table
                    columnDefinitions={execColumnDefinitions}
                    items={currentItem.pipelineExecStatusChanges}
                    multiSelect={false}
                    defaultPageSize={100}
                    pageSizes={[25, 50, 100]}
                    rowCount={currentItem.pipelineExecStatusChanges.length}
                    disableGroupBy={true}
                    disableSettings={true}
                    disablePagination={true}
                    disableFilters={true}
                    disableRowSelect={true}
                    disableSortBy={true}
                  />
                </Box>
              </ExpandableSection>
            )}

            {currentItem.pipelineStepStatusChanges != null && (
              <ExpandableSection
                variant='container'
                header={
                  <>
                    <Text>Pipeline Step Changes</Text>
                    <Box style={{ right: 16, position: 'absolute' }}>
                      <Badge content={currentItem.pipelineStepStatusChanges.length} />
                    </Box>
                  </>
                }
              >
                <Box style={{ width: '100%' }}>
                  <Table
                    columnDefinitions={stepColumnDefinitions}
                    items={currentItem.pipelineStepStatusChanges}
                    multiSelect={false}
                    defaultPageSize={100}
                    pageSizes={[25, 50, 100]}
                    rowCount={currentItem.pipelineStepStatusChanges.length}
                    disableGroupBy={true}
                    disableSettings={true}
                    disablePagination={true}
                    disableFilters={true}
                    disableRowSelect={true}
                    disableSortBy={true}
                  />
                </Box>
              </ExpandableSection>
            )}

            {currentItem.processingStepLogs != null && (
              <ExpandableSection
                variant='container'
                header={
                  <>
                    <Text>Feature engineering logs</Text>
                    <Box style={{ right: 16, position: 'absolute' }}>
                      <Badge content={currentItem.processingStepLogs.length} />
                    </Box>
                  </>
                }
              >
                <Box style={{ width: '100%' }}>
                  <Table
                    columnDefinitions={columnDefinitions}
                    items={currentItem.processingStepLogs}
                    multiSelect={false}
                    defaultPageSize={25}
                    sortBy={[{ id: 'at', desc: false }]}
                    pageSizes={[25, 50, 100]}
                    rowCount={currentItem.processingStepLogs?.length}
                    disableGroupBy={true}
                    disableSettings={true}
                    disablePagination={true}
                    disableFilters={true}
                    disableRowSelect={true}
                    disableSortBy={true}
                  />
                </Box>
              </ExpandableSection>
            )}

            {currentItem.modelTrainingExecutionStatus?.execStatus === 'Succeeded' && (
              <ExpandableSection
                variant='container'
                header={
                  <>
                    <Text>Plots generated</Text>
                    <Box style={{ right: 16, position: 'absolute' }}>
                      <Badge content={6} />
                    </Box>
                  </>
                }
              >
                <Box style={{ width: '100%' }}>
                  <FEImages executionId={currentItem.Id} />
                </Box>
              </ExpandableSection>
            )}
          </>
        </Container>
      </>
    ),
  }

  const modelTab = {
    id: 'modelTab',
    label: 'Model',
    content: (
      <>
        {currentItem.modelInfo != null && (
          <Container
            headingVariant='h4'
            title='Model'
            actionGroup={
              <Inline>
                <Button onClick={onRefreshClick}>
                  <ButtonIcon type='refresh' />
                </Button>
                {currentItem.modelInfo.endpointStatus === EndpointStatus.InService && (
                  <Button onClick={onModelEndpointDeleteClick}>Delete endpoint</Button>
                )}
                {currentItem.modelInfo.endpointArn == null && (
                  <Button variant='primary' onClick={onCreateModelEndpointClick}>
                    Create model endpoint
                  </Button>
                )}
              </Inline>
            }
          >
            <ColumnLayout>
              <Column key='col1'>
                <Stack>
                  <KeyValuePair label='Model name' value={currentItem.modelInfo.name} />
                  <KeyValuePair label='ModelArn' value={currentItem.modelInfo.arn} />
                </Stack>
              </Column>
              <Column key='col2'>
                <Stack>
                  <KeyValuePair label='Endpoint name' value={currentItem.modelInfo.endpointName} />
                  <KeyValuePair label='Endpoint Status' value={currentItem.modelInfo.endpointStatus} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='EndpointArn' value={currentItem.modelInfo.endpointArn} />
                  <KeyValuePair label='EndpointConfigArn' value={currentItem.modelInfo.endpointConfigArn} />
                </Stack>
              </Column>
              <Column key='col4'>
                <Stack>
                  <KeyValuePair label='Data URL' value={currentItem.modelInfo.dataUrl} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
        )}

        {currentItem.modelInfo != null && currentItem.modelInfo.endpointStatus === EndpointStatus.InService && (
          <Container
            headingVariant='h4'
            title='Model inference'
            actionGroup={
              <Inline>
                <Button variant='primary' onClick={onInvokeModelEndpointClick} loading={predictionLoading}>
                  Generate prediction
                </Button>
                <Button
                  variant='normal'
                  onClick={() => history.push(`/${appvars.URL.MODEL_PREDICTION}/${currentItem.Id}`)}
                >
                  View prediction analysis
                </Button>
              </Inline>
            }
          >
            <Form actions={<></>}>
              <ColumnLayout>
                <Column key='quantiles'>
                  <FormField label='Quantiles' controlId='field_Quantiles' infoKey='model.quantiles'>
                    <Stack>
                      <Inline>
                        <Input
                          onChange={(value) => {
                            const val = parseFloat(value)

                            if (!isNaN(val)) {
                              setTempQuantile(val)
                            }
                          }}
                          placeholder='Add a new value'
                        />
                        <Button
                          variant='icon'
                          icon='add_plus'
                          onClick={() => {
                            const newQuantiles = new Set(invokeModelEndpointPayload.quantiles)
                            newQuantiles.add(tempQuantile)

                            setInvokeModelEndpointPayload({
                              ...invokeModelEndpointPayload,
                              quantiles: Array.from(newQuantiles).sort(),
                            })
                          }}
                        />

                        <TokenGroup
                          items={invokeModelEndpointPayload.quantiles.map((q) => ({ label: `${q}`, value: `${q}` }))}
                          onDismiss={(item) => {
                            if (item.value == null) {
                              return
                            }
                            const val = parseFloat(item.value)
                            setInvokeModelEndpointPayload({
                              ...invokeModelEndpointPayload,
                              quantiles: invokeModelEndpointPayload.quantiles.filter((q) => q !== val),
                            })
                          }}
                        />
                      </Inline>
                    </Stack>
                  </FormField>
                </Column>
                <Column key='samples'>
                  <FormField label='Number of samples' controlId='field_numSamples'>
                    <Input
                      type='number'
                      controlId='field_numSamples'
                      value={invokeModelEndpointPayload.numSamples}
                      onChange={(value) =>
                        setInvokeModelEndpointPayload({
                          ...invokeModelEndpointPayload,
                          numSamples: parseInt(value, 10),
                        })
                      }
                      required={true}
                    />
                  </FormField>
                </Column>
              </ColumnLayout>
            </Form>
          </Container>
        )}
      </>
    ),
  }

  return (
    <>
      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteModal}
        title={`Delete ${currentItem.Id})`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{currentItem.Id}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>

      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteEndpointModal}
        title={'Delete model endpoint'}
        onCancelClicked={() => setShowDeleteEndpointModal(false)}
        onDeleteClicked={proceedWithDeleteEndpoint}
      >
        <>
          <Text>
            Are you sure you want to delete model endpoint <b>{currentItem.modelInfo?.endpointArn}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container
        headingVariant='h2'
        title={`Model training ${currentItem.Id} - with ${currentTemplateName}`}
        actionGroup={actionGroup}
      >
        <Container headingVariant='h4' title='General information'>
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
                    <Link href={`/${appvars.URL.MODEL_TRAINING_EXECUTION}/${currentItem.templateId}`}>
                      {`${currentTemplateName} (${currentItem.templateId})`}
                    </Link>
                  }
                />
              </Stack>
            </Column>
            <Column key='col3'>
              <Stack>
                <KeyValuePair
                  label='Created'
                  value={dayjslocal(currentItem.createdAt).format(appvars.DATETIMEFORMAT)}
                />
              </Stack>
            </Column>
            <Column key='col4'>
              <Stack>
                <KeyValuePair
                  label='Last updated'
                  value={
                    currentItem.updatedAt ? dayjslocal(currentItem.updatedAt).format(appvars.DATETIMEFORMAT) : null
                  }
                />
              </Stack>
            </Column>
          </ColumnLayout>
        </Container>

        <Tabs variant='container' tabs={[trainingTab, modelTab]} />
      </Container>
    </>
  )
}
