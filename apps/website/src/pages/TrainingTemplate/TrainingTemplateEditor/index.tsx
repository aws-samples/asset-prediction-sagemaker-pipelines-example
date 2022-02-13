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

import { FunctionComponent, useCallback, useEffect, useState, useMemo } from 'react'
import { TrainingTemplateData, EMPTY_TrainingTemplateData } from '../../../models'
import {
  Button,
  Checkbox,
  ColumnLayout,
  DatePicker,
  Form,
  FormSection,
  Inline,
  Input,
  Multiselect,
  Select,
  Stack,
  Tabs,
  Text,
  Toggle,
} from 'aws-northstar'
import { Container, FormField } from '../../../components/NorthstarEx'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'
import { useAssetContext } from '../../../contexts/AssetContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import { SelectOption } from 'aws-northstar/components/Select'
import { selectOptionsFor, valueOptionFor, valueOptions, valueOptionsGen } from '../../../utils/select-option-helper'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'

export const TrainingTemplateEditor: FunctionComponent = () => {
  const history = useHistory()
  const { trainingTemplateId } = useParams<{ trainingTemplateId: string }>()
  const [{ items: trainingTemplateItems, isLoading }, { updateItem, createItem }] = useTrainingTemplateContext()
  const [{ assets, assetClasses }] = useAssetContext()

  const editMode = !(trainingTemplateId === 'new' || trainingTemplateId === undefined)
  const [trainingTemplateData, updateTrainingTemplateData] = useImmer<TrainingTemplateData>(() => {
    if (editMode && trainingTemplateItems != null) {
      const sel = trainingTemplateItems.find((x) => x.Id === trainingTemplateId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_TrainingTemplateData,
      Id: uuid(),
    }
  })

  const [assetSelectOptions, setAssetSelectOptions] = useState<SelectOption[]>([])
  const [assetClassSelectOptions, setAssetClassSelectOptions] = useState<SelectOption[]>([])

  const [formError, setFormError] = useState<string>()

  // :: assets SelectOptions
  useEffect(() => {
    // TODO: sort by ticker
    const tickers = assets.map((x) => x.ticker)
    const options: SelectOption[] = selectOptionsFor(tickers)
    // const selector = (asset: AssetData) => asset.ticker
    // const options: SelectOption[] = selectOptionsGrouped(assets, 'assetClass', selector, selector)
    setAssetSelectOptions(options)
  }, [assets])

  // :: assetClass SelectOptions
  useEffect(() => {
    setAssetClassSelectOptions(selectOptionsFor(assetClasses))
  }, [assetClasses])

  // :: selectValue :: predictedAsset
  const predictedAssetValueOption = useMemo(() => {
    return valueOptionFor(assetSelectOptions, trainingTemplateData.predictedAsset)
  }, [trainingTemplateData.predictedAsset, assetSelectOptions])

  const assetsForTAValueOptions = useMemo(() => {
    return valueOptions(assetSelectOptions, trainingTemplateData.feMeta.taSettings.assets)
  }, [trainingTemplateData.feMeta.taSettings.assets, assetSelectOptions])

  const baseAssetsAllChecked = useMemo(() => {
    return trainingTemplateData.feMeta.baseAssets === 'all'
  }, [trainingTemplateData.feMeta.baseAssets])

  const tempBaseAssetOptions = useMemo(() => {
    if (trainingTemplateData.feMeta.baseAssets === 'all') {
      return
    }

    return valueOptions(assetSelectOptions, trainingTemplateData.feMeta.baseAssets as string[])
  }, [trainingTemplateData.feMeta.baseAssets, assetSelectOptions])

  // :: selectValue :: assetsForArima
  const assetsForArimaValueOptions = useMemo(() => {
    return valueOptions(assetSelectOptions, trainingTemplateData.feMeta.arimaSettings.assets)
  }, [trainingTemplateData.feMeta.arimaSettings.assets, assetSelectOptions])

  // :: selectValue :: assetsForFFT
  const assetClassesForFFTValueOptions = useMemo(() => {
    return valueOptions(assetClassSelectOptions, trainingTemplateData.feMeta.fftSettings.assetClasses)
  }, [trainingTemplateData.feMeta.fftSettings.assetClasses, assetClassSelectOptions])

  // :: selectValue :: fftNumSteps
  const fftNumStepsValueOptions = useMemo(() => {
    return valueOptionsGen(trainingTemplateData.feMeta.fftSettings.num_steps.map((x) => x.toString()))
  }, [trainingTemplateData.feMeta.fftSettings.num_steps])

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (trainingTemplateData == null) {
        throw new Error('TrainingTemplateData is null')
      }

      try {
        if (editMode) {
          updateItem(trainingTemplateData, true)
        } else {
          await createItem(trainingTemplateData)
        }

        history.push(`/${appvars.URL.TRAINING_TEMPLATE}/${trainingTemplateData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} training template object: ${err}`)
      }
    },
    [trainingTemplateData, history, updateItem, createItem, setFormError, editMode],
  )

  if (trainingTemplateData == null) {
    return null
  }

  const FEContent = (
    <>
      <Container
        headingVariant='h2'
        title='Base Assets'
        actionGroup={
          <Toggle
            label={baseAssetsAllChecked ? 'All' : 'Selective'}
            checked={baseAssetsAllChecked}
            onChange={(checked: boolean) => {
              updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                draft.feMeta.baseAssets = checked ? 'all' : assets.map((a) => a.Id)
              })
            }}
          />
        }
        infoKey='fe.baseAssets'
      >
        <ColumnLayout>
          <Stack>
            <FormField label='Base Assets' stretch controlId='multiselect_BaseAssets' infoKey='fe.baseAssets'>
              <Multiselect
                disabled={baseAssetsAllChecked}
                checkboxes={true}
                options={assetSelectOptions}
                onChange={(selected) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    const selectedAssetIds = selected.map((x) => x.value as string)
                    draft.feMeta.baseAssets = selectedAssetIds
                  })
                }}
                placeholder='Selected base assets'
                controlId='multiselect_BaseAssets'
                value={baseAssetsAllChecked ? undefined : tempBaseAssetOptions}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </Container>

      <Container
        headingVariant='h2'
        title='Technical Analysis features'
        actionGroup={
          <Toggle
            label={trainingTemplateData.feMeta.taSettings.enabled ? 'Enabled' : 'Disabled'}
            checked={trainingTemplateData.feMeta.taSettings.enabled}
            onChange={(checked: boolean) => {
              updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                draft.feMeta.taSettings.enabled = checked
              })
            }}
          />
        }
        infoKey='fe.ta.header'
      >
        <ColumnLayout>
          <Stack>
            <ColumnLayout>
              <Stack>
                <FormField label='Bollinger Band Window' controlId='field_bb_window' infoKey='fe.ta.bbWindow'>
                  <Input
                    type='number'
                    controlId='field_bb_window'
                    value={trainingTemplateData.feMeta.taSettings.bollingerBand.window}
                    required={true}
                    placeholder='BB window'
                    onChange={(e) => {
                      updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                        draft.feMeta.taSettings.bollingerBand.window = parseInt(e, 10)
                      })
                    }}
                  />
                </FormField>
              </Stack>
              <Stack>
                <FormField
                  label='Bollinger Band Window deviance'
                  controlId='field_bb_window_dev'
                  infoKey='fe.ta.bbWindowDev'
                >
                  <Input
                    type='number'
                    controlId='field_bb_window_dev'
                    value={trainingTemplateData.feMeta.taSettings.bollingerBand.window_dev}
                    required={true}
                    placeholder='BB window dev'
                    onChange={(e) => {
                      updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                        draft.feMeta.taSettings.bollingerBand.window_dev = parseInt(e, 10)
                      })
                    }}
                  />
                </FormField>
              </Stack>
            </ColumnLayout>
            <Stack>
              <FormField label='Assets for TA' stretch controlId='multiselect_AssetsForTA' infoKey='fe.ta.assets'>
                <Multiselect
                  checkboxes={true}
                  options={assetSelectOptions}
                  onChange={(selected) => {
                    updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                      draft.feMeta.taSettings.assets = selected.map((x) => x.value as string)
                    })
                  }}
                  placeholder='Selected assets for TA'
                  controlId='multiselect_AssetsForTA'
                  value={assetsForTAValueOptions}
                />
              </FormField>
            </Stack>
          </Stack>
          <Stack>
            <ColumnLayout>
              <Stack>
                <FormField label='RSI Window' controlId='field_rsi_window' infoKey='fe.ta.rsiWindow'>
                  <Input
                    type='number'
                    controlId='field_rsi_window'
                    value={trainingTemplateData.feMeta.taSettings.rsi.window}
                    required={true}
                    placeholder='RSI window'
                    onChange={(e) => {
                      updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                        draft.feMeta.taSettings.rsi.window = parseInt(e, 10)
                      })
                    }}
                  />
                </FormField>
              </Stack>
              <Stack>
                <FormField label='SMA Window' controlId='field_sma_window' infoKey='fe.ta.smaWindow'>
                  <Input
                    type='number'
                    controlId='field_sma_window'
                    value={trainingTemplateData.feMeta.taSettings.sma.window}
                    required={true}
                    placeholder='SMA window'
                    onChange={(e) => {
                      updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                        draft.feMeta.taSettings.sma.window = parseInt(e, 10)
                      })
                    }}
                  />
                </FormField>
              </Stack>
            </ColumnLayout>
          </Stack>
        </ColumnLayout>
      </Container>

      <Container
        headingVariant='h2'
        title='ARIMA features'
        actionGroup={
          <Toggle
            label={trainingTemplateData.feMeta.arimaSettings.enabled ? 'Enabled' : 'Disabled'}
            checked={trainingTemplateData.feMeta.arimaSettings.enabled}
            onChange={(checked: boolean) => {
              updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                draft.feMeta.arimaSettings.enabled = checked
              })
            }}
          />
        }
        infoKey='fe.arima.header'
      >
        <ColumnLayout>
          <Stack>
            <FormField label='Train set size' controlId='field_arima_trainsize' infoKey='fe.arima.trainSetSize'>
              <Input
                type='number'
                controlId='field_arima_trainsize'
                value={trainingTemplateData.feMeta.arimaSettings.trainSetSize}
                required={true}
                placeholder='Train set size'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.arimaSettings.trainSetSize = parseFloat(e)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Assets for ARIMA' controlId='multiselect_AssetsForArima' infoKey='fe.arima.assets'>
              <Multiselect
                checkboxes={true}
                options={assetSelectOptions}
                onChange={(selected) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.arimaSettings.assets = selected.map((x) => x.value as string)
                  })
                }}
                placeholder='Selected assets for ARIMA'
                controlId='multiselect_AssetsForArima'
                value={assetsForArimaValueOptions}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </Container>

      <Container
        headingVariant='h2'
        title='FFT features'
        actionGroup={
          <Toggle
            label={trainingTemplateData.feMeta.fftSettings.enabled ? 'Enabled' : 'Disabled'}
            checked={trainingTemplateData.feMeta.fftSettings.enabled}
            onChange={(checked: boolean) => {
              updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                draft.feMeta.fftSettings.enabled = checked
              })
            }}
          />
        }
        infoKey='fe.fft.header'
      >
        <ColumnLayout>
          <Stack>
            <FormField label='Steps number' controlId='field_fft_num_steps' infoKey='fe.fft.numSteps'>
              <Multiselect
                freeSolo={true}
                onChange={(selected) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    const steps = selected.map((x) => parseInt(x.value as string, 10))
                    steps.sort((a, b) => a - b)
                    draft.feMeta.fftSettings.num_steps = steps
                  })
                }}
                placeholder='Selected step numbers for FFT'
                controlId='field_fft_num_steps'
                value={fftNumStepsValueOptions}
              />
            </FormField>
          </Stack>
        </ColumnLayout>

        <ColumnLayout>
          <Stack>
            <FormField
              label='Assets classes for FFT'
              controlId='multiselect_AssetClassesForFFT'
              infoKey='fe.fft.assets'
            >
              <Multiselect
                checkboxes={true}
                options={assetClassSelectOptions}
                onChange={(selected) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.fftSettings.assetClasses = selected.map((x) => x.value as string)
                  })
                }}
                placeholder='Selected asset classes for FFT'
                controlId='multiselect_AssetClassesForFFT'
                value={assetClassesForFFTValueOptions}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </Container>

      <Container
        headingVariant='h2'
        title='Auto Encoder'
        actionGroup={
          <Toggle
            label={trainingTemplateData.feMeta.autoEncoderSettings.enabled ? 'Enabled' : 'Disabled'}
            checked={trainingTemplateData.feMeta.autoEncoderSettings.enabled}
            onChange={(checked: boolean) => {
              updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                draft.feMeta.autoEncoderSettings.enabled = checked
              })
            }}
          />
        }
        infoKey='fe.ae.header'
      >
        <ColumnLayout>
          <Stack>
            <FormField label='Optimizer' controlId='field_ae_optimizer' infoKey='fe.ae.optimizer'>
              <Input
                type='text'
                controlId='field_ae_optimizer'
                value={trainingTemplateData.feMeta.autoEncoderSettings.optimizer}
                required={true}
                placeholder='Auto encoder optimizer'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.autoEncoderSettings.optimizer = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Loss' controlId='field_ae_loss' infoKey='fe.ae.loss'>
              <Input
                type='text'
                controlId='field_ae_loss'
                value={trainingTemplateData.feMeta.autoEncoderSettings.loss}
                required={true}
                placeholder='Auto encoder loss'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.autoEncoderSettings.loss = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Fit epoch' controlId='field_ae_fitEpoch' infoKey='fe.ae.fitEpoch'>
              <Input
                type='number'
                controlId='field_ae_fitEpoch'
                value={trainingTemplateData.feMeta.autoEncoderSettings.fitEpoch}
                required={true}
                placeholder='Fit epoch'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.autoEncoderSettings.fitEpoch = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Fit batchsize' controlId='field_ae_batchsize' infoKey='fe.ae.fitBatchSize'>
              <Input
                type='number'
                controlId='field_ae_batchsize'
                value={trainingTemplateData.feMeta.autoEncoderSettings.fitBatchSize}
                required={true}
                placeholder='Fit batchsize'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.taSettings.sma.window = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Fit shuffle' controlId='field_ae_suffle' infoKey='fe.ae.fitShuffle'>
              <Checkbox
                controlId='field_ae_shuffle'
                checked={trainingTemplateData.feMeta.autoEncoderSettings.fitShuffle}
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.feMeta.autoEncoderSettings.fitShuffle = e.target.checked
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </Container>
    </>
  )

  const modelTrainingContent = (
    <>
      <FormSection header='General'>
        <ColumnLayout>
          <Stack>
            <FormField label='Frequency' controlId='field_deepar_freq' infoKey='deepar.general.freq'>
              <Input
                type='text'
                controlId='field_deepar_freq'
                value={trainingTemplateData.deepARMeta.freq}
                required={true}
                disabled={true}
              />
            </FormField>
            <FormField
              label='Start date of training'
              controlId='field_deepar_startDataset'
              infoKey='deepar.general.start'
            >
              <DatePicker
                controlId='field_deepar_startDataset'
                value={dayjsutc(trainingTemplateData.deepARMeta.startDataset).toDate()}
                onChange={(e) => {
                  // TODO: handle e == null
                  if (e == null) {
                    return
                  }
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.startDataset = dayjsutc(
                      `${e.getFullYear()}-${e.getMonth() + 1}-${e.getDate()}`,
                    ).valueOf()
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField
              label='Prediction Length'
              controlId='field_deepar_predictionLen'
              infoKey='deepar.general.predictionLen'
            >
              <Input
                type='number'
                controlId='field_deepar_predictionLen'
                value={trainingTemplateData.deepARMeta.predictionLength}
                required={true}
                placeholder='Prediction Length'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.predictionLength = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
            <FormField label='End training' controlId='field_deepar_endTraining' infoKey='deepar.general.end'>
              <DatePicker
                controlId='field_deepar_endTraining'
                value={dayjsutc(trainingTemplateData.deepARMeta.endTraining).toDate()}
                onChange={(e) => {
                  if (e == null) {
                    return
                  }
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.endTraining = dayjsutc(
                      `${e.getFullYear()}-${e.getMonth() + 1}-${e.getDate()}`,
                    ).valueOf()
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Context Length' controlId='field_deepar_contextLen' infoKey='deepar.general.contextLen'>
              <Input
                type='number'
                controlId='field_deepar_contextLen'
                value={trainingTemplateData.deepARMeta.contextLength}
                required={true}
                placeholder='Context Length'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.contextLength = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
            <FormField label='Test windows' controlId='field_deepar_testWindows' infoKey='deepar.general.testWindows'>
              <Input
                type='number'
                controlId='field_deepar_testWindows'
                value={trainingTemplateData.deepARMeta.testWindows}
                required={true}
                placeholder='Test windows'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.testWindows = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>

      <FormSection header='Hyperparameters'>
        <ColumnLayout>
          <Stack>
            <FormField label='Epochs' controlId='field_deepar_hyper_epochs' infoKey='deepar.hyper.epochs'>
              <Input
                type='number'
                controlId='field_deepar_hyper_epochs'
                value={trainingTemplateData.deepARMeta.hyperParams.epochs}
                required={true}
                placeholder='Epochs'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.hyperParams.epochs = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Early stopping patience' controlId='field_deepar_hyper_esp' infoKey='deepar.hyper.esp'>
              <Input
                type='number'
                controlId='field_deepar_hyper_esp'
                value={trainingTemplateData.deepARMeta.hyperParams.early_stopping_patience}
                required={true}
                placeholder='Early stopping patience'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.hyperParams.early_stopping_patience = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Mini batch size' controlId='field_deepar_hyper_mbs' infoKey='deepar.hyper.miniBatchSize'>
              <Input
                type='number'
                controlId='field_deepar_hyper_mbs'
                value={trainingTemplateData.deepARMeta.hyperParams.mini_batch_size}
                required={true}
                placeholder='Mini batch size'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.hyperParams.mini_batch_size = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Learning rate' controlId='field_deepar_hyper_lr' infoKey='deepar.hyper.learningRate'>
              <Input
                type='number'
                controlId='field_deepar_hyper_lr'
                value={trainingTemplateData.deepARMeta.hyperParams.learning_rate}
                required={true}
                placeholder='Learning rate'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.deepARMeta.hyperParams.learning_rate = parseInt(e, 10)
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>
    </>
  )

  const tabs = [
    {
      label: 'Feature Engineering',
      id: 'feature-engineering',
      content: FEContent,
    },
    {
      label: 'Model Training Parameters',
      id: 'model-training',
      content: modelTrainingContent,
    },
  ]

  return (
    <Form
      header={editMode ? 'Edit training template' : 'New training template'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(
                editMode
                  ? `/${appvars.URL.TRAINING_TEMPLATE}/${trainingTemplateData.Id}`
                  : `/${appvars.URL.TRAINING_TEMPLATE}`,
              )
            }}
          >
            Cancel
          </Button>
          <Button type='submit' variant='primary'>
            Save
          </Button>
        </Inline>
      }
    >
      <FormSection header='Training template details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Id' controlId='field_Id' infoKey='fe.general.id'>
              <Input type='text' controlId='text_Id' value={trainingTemplateData.Id} required={true} disabled={true} />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Created' controlId='field_Created' infoKey='fe.general.created'>
              <Input
                type='text'
                controlId='text_Created'
                value={dayjsutc(trainingTemplateData.createdAt).format(appvars.DATETIMEFORMAT)}
                required={true}
                disabled={true}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Name' controlId='field_Name' infoKey='fe.general.name'>
              <Input
                type='text'
                controlId='text_Name'
                value={trainingTemplateData.name}
                required={true}
                placeholder='Training template name'
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.name = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Asset to predict' controlId='field_PredictedAsset' infoKey='fe.general.predictedAsset'>
              <Select
                placeholder='Choose asset to predict'
                options={assetSelectOptions}
                selectedOption={predictedAssetValueOption}
                onChange={(e) => {
                  updateTrainingTemplateData((draft: Draft<TrainingTemplateData>) => {
                    draft.predictedAsset = e.target.value as string
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>

      <FormSection header=''>
        <Tabs tabs={tabs} variant='container' />
      </FormSection>
    </Form>
  )
}
