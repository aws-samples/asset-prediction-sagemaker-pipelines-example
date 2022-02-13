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

import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { Button, Column, ColumnLayout, Inline, Stack, Text, DeleteConfirmationDialog, Toggle } from 'aws-northstar'
import { Container, KeyValuePair } from '../../../components/NorthstarEx'
import { useHistory, useParams } from 'react-router-dom'
import NotFound from '../../../components/NotFound'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'

export const TrainingTemplateDetails: FunctionComponent = () => {
  const history = useHistory()

  const { trainingTemplateId } = useParams<{ trainingTemplateId: string }>()
  const [{ items: trainingTemplateItems }, { deleteItem }] = useTrainingTemplateContext()
  const currentItem = trainingTemplateItems.find((x) => x.Id === trainingTemplateId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('TrainingTemplateData is null')
    }

    history.push(`/${appvars.URL.TRAINING_TEMPLATE}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('TrainingTemplateData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.TRAINING_TEMPLATE}`)
  }, [deleteItem, history, currentItem])

  const baseAssetsAllChecked = useMemo(() => {
    return currentItem?.feMeta.baseAssets === 'all'
  }, [currentItem?.feMeta.baseAssets])

  if (currentItem == null) {
    return <NotFound what={'Training template data'} backUrl={appvars.URL.TRAINING_TEMPLATE} />
  }

  const actionGroup = (
    <Inline>
      <Button onClick={onDeleteClick}>Delete</Button>
      <Button variant='primary' onClick={onEditClick}>
        Edit details
      </Button>
    </Inline>
  )

  return (
    <>
      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteModal}
        title={`Delete ${currentItem.name} (${currentItem.Id})`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{currentItem.name}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container headingVariant='h1' title={currentItem.name} actionGroup={actionGroup}>
        <Stack>
          <Container headingVariant='h3' title='Feature engineering' infoKey='fe.root'>
            <Container
              headingVariant='h4'
              title='General information'
              infoKey='fe.general.header'
              infoValues={{ templateName: currentItem.name }}
            >
              <ColumnLayout>
                <Column key='col1'>
                  <Stack>
                    <KeyValuePair label='Id' value={currentItem.Id} infoKey='fe.general.id' />
                  </Stack>
                </Column>
                <Column key='col2'>
                  <Stack>
                    <KeyValuePair label='Name' value={currentItem.name} infoKey='fe.general.name' />
                    <KeyValuePair
                      label='Predicted Asset'
                      value={currentItem.predictedAsset}
                      infoKey='fe.general.predictedAsset'
                    />
                  </Stack>
                </Column>
                <Column key='col3'>
                  <Stack>
                    <KeyValuePair
                      label='Created'
                      value={dayjsutc(currentItem.createdAt).utc().format(appvars.DATETIMEFORMAT)}
                      infoKey='fe.general.created'
                    />
                    <KeyValuePair
                      label='Updated'
                      value={dayjsutc(currentItem.updatedAt).format(appvars.DATETIMEFORMAT)}
                      infoKey='fe.general.updated'
                    />
                  </Stack>
                </Column>
              </ColumnLayout>
            </Container>
            <Container headingVariant='h4' title='Base assets' infoKey='fe.baseAssets'>
              <ColumnLayout>
                <Column key='col1'>
                  <Stack>
                    <KeyValuePair
                      label=''
                      value={baseAssetsAllChecked ? 'All' : (currentItem.feMeta.baseAssets as string[]).join(', ')}
                    />
                  </Stack>
                </Column>
              </ColumnLayout>
            </Container>
            <Container
              headingVariant='h4'
              title='Technical Analysis features'
              actionGroup={
                <Toggle
                  label={currentItem.feMeta.taSettings.enabled ? 'Enabled' : 'Disabled'}
                  checked={currentItem.feMeta.taSettings.enabled}
                  disabled={true}
                />
              }
              infoKey='fe.ta.header'
            >
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='BB window'
                        value={currentItem.feMeta.taSettings.bollingerBand.window}
                        infoKey='fe.ta.bbWindow'
                      />
                      <KeyValuePair
                        label='BB window deviation'
                        value={currentItem.feMeta.taSettings.bollingerBand.window_dev}
                        infoKey='fe.ta.bbWindowDev'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='RSI window'
                        value={currentItem.feMeta.taSettings.rsi.window}
                        infoKey='fe.ta.rsiWindow'
                      />
                      <KeyValuePair
                        label='SMA window'
                        value={currentItem.feMeta.taSettings.sma.window}
                        infoKey='fe.ta.smaWindow'
                      />
                    </Stack>
                  </Column>
                  <Column key='col3'>
                    <Stack>
                      <KeyValuePair
                        label='TA Assets'
                        value={currentItem.feMeta.taSettings.assets.join(', ')}
                        infoKey='fe.ta.assets'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
            <Container
              headingVariant='h4'
              title='ARIMA features'
              actionGroup={
                <Toggle
                  label={currentItem.feMeta.arimaSettings.enabled ? 'Enabled' : 'Disabled'}
                  checked={currentItem.feMeta.arimaSettings.enabled}
                  disabled={true}
                />
              }
              infoKey='fe.arima.header'
            >
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='Train set size'
                        value={currentItem.feMeta.arimaSettings.trainSetSize}
                        infoKey='fe.arima.trainSetSize'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='ARIMA Assets'
                        value={currentItem.feMeta.arimaSettings.assets.join(', ')}
                        infoKey='fe.arima.assets'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
            <Container
              headingVariant='h4'
              title='FFT features'
              actionGroup={
                <Toggle
                  label={currentItem.feMeta.fftSettings.enabled ? 'Enabled' : 'Disabled'}
                  checked={currentItem.feMeta.fftSettings.enabled}
                  disabled={true}
                />
              }
              infoKey='fe.fft.header'
            >
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='Num steps'
                        value={currentItem.feMeta.fftSettings.num_steps.join(', ')}
                        infoKey='fe.fft.numSteps'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='FFT Asset classes'
                        value={currentItem.feMeta.fftSettings.assetClasses.join(', ')}
                        infoKey='fe.fft.assets'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
            <Container
              headingVariant='h4'
              title='Auto encoder settings'
              actionGroup={
                <Toggle
                  label={currentItem.feMeta.autoEncoderSettings.enabled ? 'Enabled' : 'Disabled'}
                  checked={currentItem.feMeta.autoEncoderSettings.enabled}
                  disabled={true}
                />
              }
              infoKey='fe.ae.header'
            >
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='Optimizer'
                        value={currentItem.feMeta.autoEncoderSettings.optimizer}
                        infoKey='fe.ae.optimizer'
                      />
                      <KeyValuePair
                        label='Loss'
                        value={currentItem.feMeta.autoEncoderSettings.loss}
                        infoKey='fe.ae.loss'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='Fit epoch'
                        value={currentItem.feMeta.autoEncoderSettings.fitEpoch}
                        infoKey='fe.ae.fitEpoch'
                      />
                      <KeyValuePair
                        label='Fit batch size'
                        value={currentItem.feMeta.autoEncoderSettings.fitBatchSize}
                        infoKey='fe.ae.fitBatchSize'
                      />
                    </Stack>
                  </Column>
                  <Column key='col3'>
                    <Stack>
                      <KeyValuePair
                        label='Fit shuffle'
                        value={currentItem.feMeta.autoEncoderSettings.fitShuffle ? 'Yes' : 'No'}
                        infoKey='fe.ae.fitShuffle'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
          </Container>

          <Container headingVariant='h3' title='Deep AR settings' infoKey='deepar.root'>
            <Container headingVariant='h4' title='General' infoKey='deepar.general.header'>
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='Frequency'
                        value={currentItem.deepARMeta.freq}
                        infoKey='deepar.general.freq'
                      />
                      <KeyValuePair
                        label='Test windows'
                        value={currentItem.deepARMeta.testWindows}
                        infoKey='deepar.general.testWindows'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='Prediction length'
                        value={currentItem.deepARMeta.predictionLength}
                        infoKey='deepar.general.predictionLen'
                      />
                      <KeyValuePair
                        label='Context length'
                        value={currentItem.deepARMeta.contextLength}
                        infoKey='deepar.general.contextLen'
                      />
                    </Stack>
                  </Column>
                  <Column key='col3'>
                    <Stack>
                      <KeyValuePair
                        label='Training start date'
                        value={dayjsutc(currentItem.deepARMeta.startDataset).format(appvars.DATEFORMAT)}
                        infoKey='deepar.general.start'
                      />
                      <KeyValuePair
                        label='Training end date'
                        value={dayjsutc(currentItem.deepARMeta.endTraining).format(appvars.DATEFORMAT)}
                        infoKey='deepar.general.end'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
            <Container headingVariant='h4' title='Hyperparameters' infoKey='deepar.hyper.header'>
              <Stack>
                <ColumnLayout>
                  <Column key='col1'>
                    <Stack>
                      <KeyValuePair
                        label='Epochs'
                        value={currentItem.deepARMeta.hyperParams.epochs}
                        infoKey='deepar.hyper.epochs'
                      />
                    </Stack>
                  </Column>
                  <Column key='col2'>
                    <Stack>
                      <KeyValuePair
                        label='Early stopping patience'
                        value={currentItem.deepARMeta.hyperParams.early_stopping_patience}
                        infoKey='deepar.hyper.esp'
                      />
                    </Stack>
                  </Column>
                  <Column key='col3'>
                    <Stack>
                      <KeyValuePair
                        label='Mini batch size'
                        value={currentItem.deepARMeta.hyperParams.mini_batch_size}
                        infoKey='deepar.hyper.miniBatchSize'
                      />
                    </Stack>
                  </Column>
                  <Column key='col4'>
                    <Stack>
                      <KeyValuePair
                        label='Learning rate'
                        value={currentItem.deepARMeta.hyperParams.learning_rate}
                        infoKey='deepar.hyper.learningRate'
                      />
                    </Stack>
                  </Column>
                </ColumnLayout>
              </Stack>
            </Container>
          </Container>
        </Stack>
      </Container>
    </>
  )
}
