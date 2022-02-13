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

import { FunctionComponent, useCallback, useState } from 'react'
import {
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
} from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import NotFound from '../../../components/NotFound'
import { useAssetContext } from '../../../contexts/AssetContext'
import { appvars } from '../../../config'
import { downloadFile } from '../../../services/download'

export const AssetDetails: FunctionComponent = () => {
  const history = useHistory()
  const { assetId } = useParams<{ assetId: string }>()
  const [{ assets }, { deleteAsset }] = useAssetContext()
  const currentItem = assets.find((_a) => _a.Id === assetId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const onDeleteClick = useCallback(async () => {
    console.debug(`[AssetDetails] :: onDeleteClick :: selected item: ${JSON.stringify(currentItem)}`)
    setShowDeleteModal(true)
  }, [currentItem])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('AssetData is null')
    }

    history.push(`/${appvars.URL.ASSET}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('AssetData is null')
    }

    await deleteAsset(currentItem.Id)
    history.push(`/${appvars.URL.ASSET}`)
  }, [deleteAsset, history, currentItem])

  const downloadCsv = useCallback(() => {
    if (currentItem == null) {
      return
    }
    downloadFile('csv', currentItem.ticker)
  }, [currentItem])

  if (currentItem == null) {
    return <NotFound what={'Asset'} backUrl={appvars.URL.ASSET} />
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
        title={`Delete ${currentItem.Id}`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{currentItem.ticker}</b> asset?
            <br />
            This will remove all related data to this asset!
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container
        headingVariant='h3'
        title={currentItem.ticker}
        subtitle={`Asset details for ${currentItem.ticker}`}
        actionGroup={actionGroup}
      >
        <ColumnLayout>
          <Column key='col1'>
            <Stack>
              <KeyValuePair label='Ticker' value={currentItem.ticker} />
              <KeyValuePair label='Asset Class' value={currentItem.assetClass} />
              <KeyValuePair label='Description' value={currentItem.description} />
            </Stack>
          </Column>
          <Column key='col2'>
            <Stack>
              <KeyValuePair label='Start date' value={currentItem.startDateStr} />
              <KeyValuePair label='End date' value={currentItem.endDateStr} />
            </Stack>
          </Column>
          <Column key='col3'>
            <Stack>
              <KeyValuePair label='Number of entries' value={currentItem.dataRows} />
              <KeyValuePair
                label='CSV'
                value={
                  currentItem.dataRows ? (
                    <Link href='#' onClick={downloadCsv}>
                      Download
                    </Link>
                  ) : (
                    '-'
                  )
                }
              />
            </Stack>
          </Column>
        </ColumnLayout>
      </Container>
    </>
  )
}
