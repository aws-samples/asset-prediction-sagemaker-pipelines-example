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
import { InvokeModelEndpointPayload, ModelTrainingExecutionData } from '../../models'
import { ModelTrainingExecutionService } from '../../services/model-training-execution'

interface ModelTrainingExecutionState {
  readonly items: ModelTrainingExecutionData[]
  readonly isLoading: boolean
}

interface ModelTrainingExecutionUpdater {
  readonly setItems: (items: ModelTrainingExecutionData[]) => void
  readonly refreshItems: () => void

  readonly getItem: (itemId: string) => Promise<void>
  readonly updateItem: (item: ModelTrainingExecutionData, persist?: boolean) => void
  readonly createItem: (item: ModelTrainingExecutionData) => void
  readonly deleteItem: (itemId: string) => Promise<void>

  readonly startModelTraining: (itemId: string) => Promise<void>
  readonly createModelEndpoint: (itemId: string) => Promise<void>
  readonly invokeModelEndpoint: (payload: InvokeModelEndpointPayload) => Promise<void>
  readonly deleteModelEndpoint: (itemId: string) => Promise<void>
}

type ModelTrainingExecutionContextInterface = [ModelTrainingExecutionState, ModelTrainingExecutionUpdater]
const ModelTrainingExecutionContext = createContext<ModelTrainingExecutionContextInterface | null>(null)

export const ModelTrainingExecutionProvider = ({ children }: PropsWithChildren<any>): any => {
  const [state, updateState] = useImmer<ModelTrainingExecutionState>({
    items: [],
    isLoading: false,
  })

  const stateRef = useRef<ModelTrainingExecutionState>(state)
  stateRef.current = state

  const fetchItems = useCallback(async () => {
    console.debug('TrainingInstanceContext :: fetchAll')
    updateState((draft: Draft<ModelTrainingExecutionState>) => {
      draft.isLoading = true
    })
    const items = await ModelTrainingExecutionService.list()

    updateState((draft: Draft<ModelTrainingExecutionState>) => {
      draft.items = items
      draft.isLoading = false
    })
  }, [updateState])

  const fetchItem = useCallback(
    async (id: string) => {
      const item = await ModelTrainingExecutionService.getItem(id)
      updateState((draft: Draft<ModelTrainingExecutionState>) => {
        const index = draft.items.findIndex((x) => x.Id === item.Id)

        if (index < 0) {
          draft.items.push(item)
        } else {
          draft.items[index] = item
        }
      })
    },
    [updateState],
  )

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const updater = useMemo<ModelTrainingExecutionUpdater>((): ModelTrainingExecutionUpdater => {
    return {
      setItems: (items: ModelTrainingExecutionData[]): void => {
        updateState((draft: Draft<ModelTrainingExecutionState>) => {
          draft.items = items
        })
      },

      refreshItems: (): void => {
        ;(async () => {
          await fetchItems()
        })()
      },

      getItem: async (itemId: string): Promise<void> => {
        await fetchItem(itemId)
      },

      updateItem: (item: ModelTrainingExecutionData, persist?: boolean): void => {
        updateState((draft: Draft<ModelTrainingExecutionState>) => {
          const index = draft.items.findIndex((x) => x.Id === item.Id)

          if (index < 0) {
            throw new Error(`Failed to find item with id ${item.Id}`)
          }

          draft.items[index] = item

          if (persist) {
            ModelTrainingExecutionService.update(item)
          }
        })
      },

      createItem: async (item: ModelTrainingExecutionData): Promise<void> => {
        const newItem = await ModelTrainingExecutionService.create(item)

        updateState((draft: Draft<ModelTrainingExecutionState>) => {
          draft.items.push(newItem)
        })
      },

      deleteItem: async (id: string): Promise<void> => {
        await ModelTrainingExecutionService.deleteItem(id)

        updateState((draft) => {
          const newItems = draft.items.filter((x) => x.Id !== id)
          draft.items = newItems
        })
      },

      startModelTraining: async (itemId: string): Promise<void> => {
        const updatedItem = await ModelTrainingExecutionService.startModelTraining(itemId)

        updateState((draft) => {
          const index = draft.items.findIndex((x) => x.Id === itemId)

          if (index < 0) {
            throw new Error(`Failed to find item with id ${itemId}`)
          }

          draft.items[index] = updatedItem
        })
      },

      createModelEndpoint: async (itemId: string): Promise<void> => {
        const updatedItem = await ModelTrainingExecutionService.createModelEndpoint(itemId)

        updateState((draft) => {
          const index = draft.items.findIndex((x) => x.Id === itemId)

          if (index < 0) {
            throw new Error(`Failed to find item with id ${itemId}`)
          }

          draft.items[index] = updatedItem
        })
      },

      deleteModelEndpoint: async (itemId: string): Promise<void> => {
        await ModelTrainingExecutionService.deleteModelEndpoint(itemId)
      },

      invokeModelEndpoint: async (payload: InvokeModelEndpointPayload): Promise<void> => {
        await ModelTrainingExecutionService.invokeModelEndpoint(payload)
      },
    }
  }, [updateState, fetchItems, fetchItem])

  const contextValue = useMemo<ModelTrainingExecutionContextInterface>(() => [state, updater], [state, updater])

  return (
    <ModelTrainingExecutionContext.Provider value={contextValue}>{children}</ModelTrainingExecutionContext.Provider>
  )
}

export const useModelTrainingExecutionContext = (): ModelTrainingExecutionContextInterface => {
  const context = useContext(ModelTrainingExecutionContext)

  if (context == null) {
    throw new Error('ModelTrainingExecutionContext is null')
  }

  return context
}
