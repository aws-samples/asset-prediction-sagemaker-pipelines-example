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
import { Button, ColumnLayout, Form, FormField, FormSection, Inline, Input, Select, Stack } from 'aws-northstar'
import { SelectOption } from 'aws-northstar/components/Select'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { dayjslocal } from '../../../utils/dayjs'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'
import { useModelTrainingExecutionContext } from '../../../contexts/ModelTrainingExecutionContext'
import { appvars } from '../../../config'
import { ModelTrainingExecutionData, EMPTY_ModelTrainingExecutionData } from '../../../models'
import { valueOptionFor } from '../../../utils/select-option-helper'
import { useTrainingTemplateContext } from '../../../contexts/TrainingTemplateContext'

export const ModelTrainingExecutionEditor: FunctionComponent = () => {
  const history = useHistory()
  const { modelTrainingExecutionId } = useParams<{ modelTrainingExecutionId: string }>()
  const [{ items: modelTrainingExecutionItems }, { updateItem, createItem }] = useModelTrainingExecutionContext()
  const [{ items: trainingTemplateItems }] = useTrainingTemplateContext()

  const editMode = !(modelTrainingExecutionId === 'new' || modelTrainingExecutionId === undefined)
  const [trainingInstanceData, updateTrainingInstanceData] = useImmer<ModelTrainingExecutionData>(() => {
    if (editMode && modelTrainingExecutionItems != null) {
      const sel = modelTrainingExecutionItems.find((x) => x.Id === modelTrainingExecutionId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_ModelTrainingExecutionData,
      Id: uuid(),
    }
  })

  const [formError, setFormError] = useState<string>()
  const [templatesSelectOptions, setTemplatesSelectOptions] = useState<SelectOption[]>([])

  useEffect(() => {
    const options: SelectOption[] = trainingTemplateItems.map((x) => ({ label: x.name, value: x.Id } as SelectOption))
    setTemplatesSelectOptions(options)
  }, [trainingTemplateItems])

  // :: selectValue :: templateId
  const templateIdValueOption = useMemo(() => {
    return valueOptionFor(templatesSelectOptions, trainingInstanceData.templateId)
  }, [templatesSelectOptions, trainingInstanceData.templateId])

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (trainingInstanceData == null) {
        throw new Error('TrainingInstanceData is null')
      }

      try {
        if (editMode) {
          updateItem(trainingInstanceData, true)
        } else {
          await createItem(trainingInstanceData)
        }

        history.push(`${appvars.URL.MODEL_TRAINING_EXECUTION}/${trainingInstanceData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} training instance object: ${err}`)
      }
    },
    [trainingInstanceData, history, updateItem, createItem, setFormError, editMode],
  )

  if (trainingInstanceData == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit model training' : 'New model training'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(
                editMode
                  ? `/${appvars.URL.MODEL_TRAINING_EXECUTION}/${trainingInstanceData.Id}`
                  : `/${appvars.URL.MODEL_TRAINING_EXECUTION}`,
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
      <FormSection header='Model training details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Id' controlId='field_Id'>
              <Input type='text' controlId='text_Id' value={trainingInstanceData.Id} required={true} disabled={true} />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Created' controlId='field_Created'>
              <Input
                type='text'
                controlId='text_Created'
                value={dayjslocal(trainingInstanceData.createdAt).format(appvars.DATETIMEFORMAT)}
                required={true}
                disabled={true}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Status' controlId='field_Status'>
              <Input
                type='text'
                controlId='text_Status'
                value={
                  trainingInstanceData.modelTrainingExecutionStatus == null
                    ? 'CREATED'
                    : trainingInstanceData.modelTrainingExecutionStatus.execStatus
                }
                required={true}
                disabled={true}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Training template' controlId='field_TrainingTemplate'>
              <Select
                placeholder='Choose a training template'
                options={templatesSelectOptions}
                selectedOption={templateIdValueOption}
                controlId='field_TrainingTemplate'
                onChange={(e) => {
                  updateTrainingInstanceData((draft: Draft<ModelTrainingExecutionData>) => {
                    draft.templateId = e.target.value as string
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>
    </Form>
  )
}
