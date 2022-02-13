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

import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import {
  Button,
  Column,
  ColumnLayout,
  Form,
  FormField,
  FormSection,
  Inline,
  Input,
  KeyValuePair,
  Link,
  Select,
  Stack,
} from 'aws-northstar'
import Dropzone from 'react-dropzone-uploader'
import { Check, AddCircle } from '@material-ui/icons'
import { useAssetContext } from '../../../contexts/AssetContext'
import { EMPTY_ASSETDATA, AssetData } from '../../../models'
import { appvars } from '../../../config'
import AssetServiceInstance from '../../../services/asset'
import { downloadFile } from '../../../services/download'
import 'react-dropzone-uploader/dist/styles.css'
import { dayjsutc } from '../../../utils/dayjs'

const DEFAULT_DROPZONE_MESSAGE = 'Drag & drop a file or Click to browse'

export const AssetEditor: FunctionComponent = () => {
  const history = useHistory()
  const { assetId } = useParams<{ assetId: string }>()
  const [{ assets, assetClasses }, { updateAsset, createAsset, addAssetClass }] = useAssetContext()

  const editMode = !(assetId === 'new' || assetId === undefined)
  const [asset, setLocalAssetData] = useState<AssetData>()
  const [formError, setFormError] = useState<string>()
  const [showAssetClassInput, setShowAssetClassInput] = useState<boolean>(false)
  const [dropzoneMessage, setDropzoneMessage] = useState<string>(DEFAULT_DROPZONE_MESSAGE)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)

  const assetClassOptions = assetClasses.map((v) => ({ label: v, value: v }))

  useEffect(() => {
    if (editMode) {
      const a = assets.find((_a) => _a.Id === assetId)

      if (a != null) {
        setLocalAssetData(a)

        return
      }
    }

    setLocalAssetData(EMPTY_ASSETDATA)
  }, [assetId, editMode, assets])

  const downloadCsv = useCallback(async () => {
    if (asset == null) {
      return
    }
    await downloadFile('csv', asset.ticker)
  }, [asset])

  const dropzoneHandleChangeStatus = ({ meta, file }: any, status: any) => {
    // console.log('status', status)
    // console.log('meta', meta)
    // console.log('file', file)

    switch (status) {
      case 'ready':
      case 'done': {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string

          if (text == null || asset == null) {
            return
          }

          // const headers = text.slice(0, text.indexOf('\n')).split(',')
          const rows = text.slice(text.indexOf('\n') + 1).split('\n')

          const firstRow = rows[0].split(',')
          const lastRow = rows[rows.length - 1].split(',')

          setLocalAssetData({
            ...asset,
            startDateStr: firstRow[0],
            startDate: dayjsutc(firstRow[0]).valueOf(),
            endDateStr: lastRow[0],
            endDate: dayjsutc(lastRow[0]).valueOf(),
            dataRows: rows.length,
          })
        }
        reader.readAsText(file)

        setDroppedFile(file)

        break
      }
      case 'rejected_file_type': {
        setDropzoneMessage('File type not accepted. Only CSV is allowed')
        break
      }
      case 'rejected_max_files': {
        setDropzoneMessage('Max 1 file allowed')
        break
      }
      case 'error_upload':
      case 'error_upload_params': {
        setDropzoneMessage('Error while uploading')
        setDroppedFile(null)
        break
      }
      case 'removed': {
        setDroppedFile(null)
        break
      }
      default:
        setDropzoneMessage(DEFAULT_DROPZONE_MESSAGE)
        break
    }
  }

  const dropzoneGetUploadParams = useCallback(async (): Promise<any> => {
    if (asset?.ticker == null) {
      return null
    }
    const presignedPost = await AssetServiceInstance.getS3UploadUrl(asset?.ticker)

    return {
      url: presignedPost.url,
      fields: presignedPost.fields,
    }
  }, [asset?.ticker])

  const assetClassButtonClicked = useCallback(
    async (event) => {
      if (asset == null) {
        throw new Error('AssetData is null')
      }

      if (showAssetClassInput) {
        addAssetClass(asset.assetClass)
      }
      setShowAssetClassInput(!showAssetClassInput)
    },
    [showAssetClassInput, setShowAssetClassInput, addAssetClass, asset],
  )

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (asset == null) {
        throw new Error('AssetData is null')
      }

      try {
        if (editMode) {
          if (droppedFile) {
            const uploadParams = await dropzoneGetUploadParams()
            const uploadResp = await AssetServiceInstance.uploadToS3(uploadParams, droppedFile)
            // console.log(uploadResp)
          }

          updateAsset(asset, true)
        } else {
          await createAsset(asset)
        }

        history.push(`/${appvars.URL.ASSET}/${asset.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} asset object: ${err}`)
      }
    },
    [asset, history, updateAsset, createAsset, setFormError, droppedFile, editMode, dropzoneGetUploadParams],
  )

  if (asset == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit asset' : 'New asset'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(editMode ? `/${appvars.URL.ASSET}/${asset.Id}` : `/${appvars.URL.ASSET}`)
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
      <FormSection header='Asset Details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Ticker' controlId='field_Ticker'>
              <Input
                type='text'
                controlId='text_Ticker'
                value={asset.ticker}
                disabled={editMode}
                required={true}
                onChange={(e) => {
                  setLocalAssetData({ ...asset, ticker: e, Id: e })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Asset Class' controlId='field_AssetClass'>
              <div style={{ float: 'left', width: '200px' }}>
                {!showAssetClassInput && (
                  <Select
                    options={assetClasses.map((v) => ({ label: v, value: v }))}
                    controlId='field_AssetClass'
                    ariaDescribedby='This is a description'
                    selectedOption={assetClassOptions.find((v) => v.value === asset.assetClass)}
                    onChange={(e) => {
                      setLocalAssetData({
                        ...asset,
                        assetClass: e.target.value as string,
                      })
                    }}
                  />
                )}
                {showAssetClassInput && (
                  <Input
                    type='text'
                    controlId='text_AssetClass'
                    value={asset.assetClass}
                    required={true}
                    onChange={(e) => {
                      setLocalAssetData({ ...asset, assetClass: e })
                    }}
                  />
                )}
              </div>
              <div style={{ float: 'left' }}>
                <Button
                  iconAlign='right'
                  variant='icon'
                  icon={showAssetClassInput ? Check : AddCircle}
                  onClick={assetClassButtonClicked}
                />
              </div>
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Description' controlId='field_Description'>
              <Input
                type='text'
                controlId='text_Description'
                value={asset.description}
                required={true}
                placeholder='Optional asset description'
                onChange={(e) => {
                  setLocalAssetData({ ...asset, description: e })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>

      {editMode && (
        <>
          <FormSection header='CSV information'>
            <ColumnLayout>
              <Column key='col2'>
                <Stack>
                  <KeyValuePair label='Start date' value={asset.startDateStr} />
                  <KeyValuePair label='End date' value={asset.endDateStr} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='Number of entries' value={asset.dataRows} />
                  <KeyValuePair
                    label='CSV'
                    value={
                      asset.bucketKey != null ? (
                        <Link href='#' onClick={downloadCsv}>
                          Download
                        </Link>
                      ) : null
                    }
                  />
                </Stack>
              </Column>
            </ColumnLayout>
          </FormSection>

          <FormSection header='CSV upload'>
            <ColumnLayout>
              <Stack>
                <Dropzone
                  accept='text/csv'
                  autoUpload={false}
                  // getUploadParams={dropzoneGetUploadParams}
                  maxFiles={1}
                  onChangeStatus={dropzoneHandleChangeStatus}
                  canRemove={true}
                  multiple={true}
                  canCancel={false}
                  canRestart={false}
                  inputContent={dropzoneMessage}
                  inputWithFilesContent={dropzoneMessage}
                />
              </Stack>
            </ColumnLayout>
          </FormSection>
        </>
      )}
    </Form>
  )
}
