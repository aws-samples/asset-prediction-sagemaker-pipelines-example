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

import { FunctionComponent } from 'react'
import NSContainer, { ContainerProps as NSContainerProps } from 'aws-northstar/layouts/Container'
import { InfoPopover, InfoPopoverProps } from '../../InfoPopover'

type ContainerProps = NSContainerProps & InfoPopoverProps

export const Container: FunctionComponent<ContainerProps> = ({
  infoKey,
  infoHeader,
  infoValues,
  infoPopoverVariant,
  actionGroup,
  ...containerProps
}) => {
  if (infoKey == null) {
    return <NSContainer actionGroup={actionGroup} {...containerProps} />
  }

  let actionGroupWithInfo = null
  const infoPopover = (
    <InfoPopover
      infoKey={infoKey}
      infoValues={infoValues}
      infoPopoverVariant={infoPopoverVariant}
      infoIconFontSize='default'
      infoHeader={infoHeader || containerProps.title}
    />
  )

  if (actionGroup == null) {
    actionGroupWithInfo = infoPopover
  } else {
    actionGroupWithInfo = (
      <>
        {actionGroup}
        {infoPopover}
      </>
    )
  }

  return <NSContainer {...containerProps} actionGroup={actionGroupWithInfo} />
}
