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

import { ReactNode } from 'react'
import { Badge } from 'aws-northstar'

const badgesCache: Record<string, ReactNode> = {
  Failed: <Badge content='Failed' color='red' />,
  Succeeded: <Badge content='Succeeded' color='green' />,
  Executing: <Badge content='Executing' color='blue' />,
  Starting: <Badge content='Starting' color='grey' />,
  warning: <Badge content='warning' color='red' />,
  error: <Badge content='error' color='red' />,
  debug: <Badge content='debug' color='blue' />,
  info: <Badge content='info' color='grey' />,
}
export const getStatusBadge = (status: string): ReactNode => {
  const badge = badgesCache[status]

  if (badge == null) {
    return <Badge content={status} color='grey' />
  }

  return badge
}
