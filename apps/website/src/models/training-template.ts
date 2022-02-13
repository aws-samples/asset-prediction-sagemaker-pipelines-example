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

import { dayjsutc } from '../utils/dayjs'

interface FEMetadata {
  baseAssets: string | string[]
  taSettings: {
    assets: string[]
    enabled: boolean
    bollingerBand: {
      window: number
      window_dev: number
    }
    rsi: {
      window: number
    }
    sma: {
      window: number
    }
  }
  arimaSettings: {
    assets: string[]
    enabled: boolean
    trainSetSize: number // 0.80
  }
  fftSettings: {
    assetClasses: string[]
    enabled: boolean
    num_comp: number
    num_steps: number[]
  }
  autoEncoderSettings: {
    enabled: boolean
    // TODO: add more params from Sequential (see pynb)
    optimizer: string
    loss: string
    fitEpoch: number
    fitBatchSize: number
    fitShuffle: boolean
  }
}

const EMPTY_FEMetadata: FEMetadata = {
  baseAssets: 'all',
  taSettings: {
    assets: [
      'DJIA',
      'NASDAQ',
      'SPX',
      'USDJPY',
      'DJIA1MFutures',
      'B10YR',
      'B20Y',
      'EURUSD',
      'EuroBund',
      'GBPUSD',
      'AMERIBOR',
      'gold',
      'oil',
      'LIBORUSD',
      'LIBOREUR',
      'LIBORUK',
    ],
    enabled: true,
    bollingerBand: {
      window: 20,
      window_dev: 2,
    },
    rsi: {
      window: 14,
    },
    sma: {
      window: 7,
    },
  },
  arimaSettings: {
    assets: ['EURUSD', 'GBPUSD', 'gold', 'NASDAQ', 'DJIA', 'B10YR'],
    enabled: true,
    trainSetSize: 0.8,
  },
  fftSettings: {
    assetClasses: ['FX', 'Index', 'Commodity', 'Futures', 'Fixed Income'],
    enabled: true,
    num_comp: 7,
    num_steps: [3, 6, 9, 100],
  },
  autoEncoderSettings: {
    enabled: true,
    optimizer: 'adam',
    loss: 'mean_squared_error',
    fitEpoch: 460,
    fitBatchSize: 256,
    fitShuffle: false,
  },
}

interface DeepARTemplateData {
  freq: string
  predictionLength: number
  contextLength: number
  startDataset: number
  endTraining: number
  testWindows: number
  hyperParams: {
    epochs: number
    early_stopping_patience: number
    mini_batch_size: number
    learning_rate: number
  }
}

const EMPTY_DeepARTemplateData: DeepARTemplateData = {
  freq: '1D',
  predictionLength: 7,
  contextLength: 7,
  startDataset: dayjsutc('2010-01-01').valueOf(),
  endTraining: dayjsutc('2018-01-01').valueOf(),
  testWindows: 4,
  hyperParams: {
    epochs: 400,
    early_stopping_patience: 40,
    mini_batch_size: 64,
    learning_rate: 5e-4,
  },
}

export interface TrainingTemplateData {
  Id: string
  predictedAsset: string
  name: string
  createdAt: number
  updatedAt: number
  feMeta: FEMetadata
  deepARMeta: DeepARTemplateData
}

export const EMPTY_TrainingTemplateData: TrainingTemplateData = {
  Id: '',
  predictedAsset: 'B10YR',
  name: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  feMeta: EMPTY_FEMetadata,
  deepARMeta: EMPTY_DeepARTemplateData,
}
