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
import NSFormField, { FormFieldProps as NSFormFieldProps } from 'aws-northstar/components/FormField'
import { InfoPopover, InfoPopoverProps } from '../../InfoPopover'

type FormFieldProps = NSFormFieldProps & InfoPopoverProps

export const FormField: FunctionComponent<FormFieldProps> = ({
  infoKey,
  infoHeader,
  infoValues,
  infoPopoverVariant,
  ...formFieldProps
}) => {
  if (infoKey == null) {
    return <NSFormField {...formFieldProps} />
  }

  const { label } = formFieldProps

  const infoPopover = (
    <InfoPopover
      infoKey={infoKey}
      infoValues={infoValues}
      infoPopoverVariant={infoPopoverVariant}
      infoIconFontSize='small'
      infoHeader={infoHeader || typeof label === 'string' ? (label as string) : undefined}
    />
  )

  let labelWithInfo = null

  if (label == null) {
    labelWithInfo = infoPopover
  } else {
    labelWithInfo = (
      <>
        {label}
        {infoPopover}
      </>
    )
  }

  return <NSFormField {...formFieldProps} label={labelWithInfo} />
}
