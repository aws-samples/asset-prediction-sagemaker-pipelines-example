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

import { createContext, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren } from 'react'
import { IntlProvider } from 'react-intl'
import { useImmer } from 'use-immer'
import infoData from '../../docs/info.json'

type KVPair = Record<string, string>

interface InfoState {
  readonly infoItems: KVPair
}

interface InfoUpdater {
  readonly setInfoItems: (data: KVPair) => void
}

type InfoContextInterface = [InfoState, InfoUpdater]
const InfoContext = createContext<InfoContextInterface | null>(null)

export const InfoProvider = ({ children }: PropsWithChildren<any>): any => {
  const [state, updateState] = useImmer<InfoState>({
    infoItems: infoData,
  })

  const stateRef = useRef<InfoState>(state)
  stateRef.current = state

  useEffect(() => {
    updateState((draft) => {
      draft.infoItems = infoData
    })
  }, [updateState])

  const updater = useMemo<InfoUpdater>((): InfoUpdater => {
    return {
      setInfoItems: (data: KVPair): void => {
        updateState((draft) => {
          draft.infoItems = data
        })
      },
    }
  }, [updateState])

  const contextValue = useMemo<InfoContextInterface>(() => [state, updater], [state, updater])

  return (
    <InfoContext.Provider value={contextValue}>
      <IntlProvider messages={state.infoItems} locale='en'>
        {children}
      </IntlProvider>
    </InfoContext.Provider>
  )
}

export const useInfoContext = (): InfoContextInterface => {
  const context = useContext(InfoContext)

  if (context == null) {
    throw new Error('InfoContext is null')
  }

  return context
}
