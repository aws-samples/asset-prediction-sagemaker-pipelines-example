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

import { SelectOption } from 'aws-northstar/components/Select'
import { groupBy } from 'lodash'

export const selectOptionsFor = (items: string[]): SelectOption[] => {
  return items.map((x) => ({ label: x, value: x } as SelectOption))
}

export const valueOptionFor = (options: SelectOption[], value: string): SelectOption | undefined => {
  return options.find((x) => x.value === value)
}

export const valueOptions = (options: SelectOption[], values: string[]): SelectOption[] => {
  const uniqueVals = new Set(values)
  const valueOptions: SelectOption[] = []
  uniqueVals.forEach((curr) => {
    const sel = options.find((x) => x.value === curr)

    if (sel != null) {
      valueOptions.push(sel)
    }
  })

  return valueOptions
}

export const valueOptionsGen = (values: string[]): SelectOption[] => {
  const uniqueVals = new Set(values)
  const valueOptions: SelectOption[] = []
  uniqueVals.forEach((curr) => {
    valueOptions.push({ label: curr, value: curr })
  })

  return valueOptions
}

export const selectOptionsGrouped = (
  items: any[],
  groupByField: string,
  labelSelector?: (x: any) => string,
  valueSelector?: (x: any) => string,
): SelectOption[] => {
  const byGroup = groupBy(items, groupByField)
  const options: SelectOption[] = []
  for (const key in byGroup) {
    options.push({
      label: key,
      options: byGroup[key].map((x) => ({
        label: labelSelector ? labelSelector(x) : x,
        value: valueSelector ? valueSelector(x) : x,
      })),
    })
  }

  return options
}
