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

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { Draft } from 'immer'
import { useImmer } from 'use-immer'
import { sortBy } from 'lodash'
import { AssetData } from '../../models'
import AssetService from '../../services/asset'

interface AssetState {
  readonly assets: AssetData[]
  readonly assetClasses: string[]
  readonly isLoading: boolean
}

interface AssetUpdater {
  // Assets
  readonly setAssets: (assets: AssetData[]) => void
  readonly refreshAssets: () => void

  readonly addAssetClass: (assetClass: string) => void
  readonly updateAsset: (assetData: AssetData, persist?: boolean) => void
  readonly createAsset: (assetData: AssetData) => void
  readonly deleteAsset: (assetId: string) => Promise<void>
}

type AssetContextInterface = [AssetState, AssetUpdater]
const AssetContext = createContext<AssetContextInterface | null>(null)

export const AssetProvider = ({ children }: PropsWithChildren<any>): any => {
  const [state, updateState] = useImmer<AssetState>({
    assets: [],
    assetClasses: [],
    isLoading: false,
  })

  const stateRef = useRef<AssetState>(state)
  stateRef.current = state

  const fetchAssets = useCallback(async () => {
    console.debug('AssetContext :: fetchAll')
    updateState((draft: Draft<AssetState>) => {
      draft.isLoading = true
    })
    let assets = await AssetService.list()
    assets = sortBy(assets, 'ticker')

    updateState((draft: Draft<AssetState>) => {
      draft.assets = assets
      draft.assetClasses = assets.map((a) => a.assetClass).filter((v, i, a) => a.indexOf(v) === i)
      draft.isLoading = false
    })
  }, [updateState])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const updater = useMemo<AssetUpdater>((): AssetUpdater => {
    return {
      // ASSET -------------------------------------------------------------------------------------
      setAssets: (assets: AssetData[]): void => {
        updateState((draft: Draft<AssetState>) => {
          draft.assets = assets
        })
      },

      refreshAssets: (): void => {
        ;(async () => {
          await fetchAssets()
        })()
      },

      updateAsset: (asset: AssetData, persist?: boolean): void => {
        updateState((draft: Draft<AssetState>) => {
          const index = draft.assets.findIndex((a) => a.Id === asset.Id)

          if (index < 0) {
            throw new Error(`Failed to find asset with id ${asset.Id}`)
          }

          draft.assets[index] = asset

          if (persist) {
            // AssetService.update(asset)
            // updater.refreshAssets()
            ;(async () => {
              const updated = await AssetService.update(asset)
              updateState((d: Draft<AssetState>) => {
                d.assets[index] = updated
              })
            })()
          }
        })
      },

      createAsset: async (asset: AssetData): Promise<void> => {
        const newItem = await AssetService.create(asset)

        updateState((draft: Draft<AssetState>) => {
          draft.assets.push(newItem)
          // sortAssets(draft.assets)
        })
      },

      deleteAsset: async (assetId: string): Promise<void> => {
        await AssetService.deleteItem(assetId)

        updateState((draft) => {
          const newAssets = draft.assets.filter((a) => a.Id !== assetId)
          draft.assets = newAssets
        })
      },

      addAssetClass: (assetClass: string): void => {
        updateState((draft: Draft<AssetState>) => {
          if (draft.assetClasses.findIndex((v) => v === assetClass) < 0) {
            draft.assetClasses.push(assetClass)
          }
        })
      },
    }
  }, [updateState, fetchAssets])

  const contextValue = useMemo<AssetContextInterface>(() => [state, updater], [state, updater])

  return <AssetContext.Provider value={contextValue}>{children}</AssetContext.Provider>
}

export const useAssetContext = (): AssetContextInterface => {
  const context = useContext(AssetContext)

  if (context == null) {
    throw new Error('AssetContext is null')
  }

  return context
}
