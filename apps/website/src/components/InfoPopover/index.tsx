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

import { ReactNode, FunctionComponent } from 'react'
import { Box, Popover } from 'aws-northstar'
import Icon from 'aws-northstar/components/Icon'
import { FormattedMessage } from 'react-intl'

export interface InfoPopoverProps {
  infoPopoverVariant?: 'hover' | 'click'
  infoKey?: string | number
  infoHeader?: string
  infoValues?: Record<string, string | ReactNode>
  infoIconFontSize?: 'small' | 'inherit' | 'default' | 'large'
}

export const InfoPopover: FunctionComponent<InfoPopoverProps> = ({
  infoPopoverVariant = 'hover',
  infoKey,
  infoHeader = 'Info',
  infoValues,
  infoIconFontSize = 'small',
}) => {
  const infoValuesWithTags = {
    ...infoValues,
    b: (content: string) => <b>{content}</b>,
    strong: (content: string) => <strong>{content}</strong>,
    p: (content: string) => <p>{content}</p>,
    i: (content: string) => <i>{content}</i>,
  }

  return (
    <Popover
      position='bottom'
      size='large'
      header={infoHeader}
      triggerType='text'
      variant={infoPopoverVariant}
      showDismissButton={infoPopoverVariant === 'click'}
      content={<FormattedMessage id={`${infoKey}`} values={infoValuesWithTags} />}
    >
      <Box style={{ paddingLeft: 3, paddingRight: 3 }}>
        <Icon variant='Outlined' color='action' name='Info' fontSize={infoIconFontSize} />
      </Box>
    </Popover>
  )
}
