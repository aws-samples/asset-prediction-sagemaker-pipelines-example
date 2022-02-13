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

import { FunctionComponent, PropsWithChildren } from 'react'

const NotFound: FunctionComponent<PropsWithChildren<{ what: string; backUrl: string }>> = ({ what, backUrl }) => {
  return (
    <>
      <div>
        <div className='mx-auto py-12 lg:py-16 lg:flex lg:items-center lg:justify-between'>
          <h2 className='text-xl tracking-tight text-gray-900 sm:text-xl'>
            <span className='block'>{what} not found</span>
          </h2>
          <div className='mt-8 lex lg:mt-0 lg:flex-shrink-0'>
            <div className='ml-3 inline-flex rounded-md shadow'>
              <a
                href={`/${backUrl}`}
                className='inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md'
              >
                Back to list
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound
