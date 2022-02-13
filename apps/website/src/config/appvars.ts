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

/**
 * Returns the value of `parent[key]`,
 * but throws an error if the key is not set.
 *
 * @param {string} key
 */
const requireVariable = (key: string): any => {
  if (!Object.prototype.hasOwnProperty.call(appVariables, key)) {
    throw new Error(`Key ${key} not set in app variables.`)
  }

  return appVariables[key]
}

// :: ---
export const BACKENDVARS = {
  REGION: requireVariable('REGION'),
  USERPOOL_ID: requireVariable('USERPOOL_ID'),
  USERPOOL_CLIENT_ID: requireVariable('USERPOOL_CLIENT_ID'),
  API_URL: requireVariable('API_URL'),
  API_PREFIX: 'api/web',
  API_DS_NAME: 'datasource',
}

export const ENDPOINT = {
  ASSET: 'asset',
  TRAINING_TEMPLATE: 'training-template',
  MODEL_TRAINING_EXECUTION: 'model-training-execution',
  ML: 'ml',
  MODEL_PREDICTION: 'model-prediction',
}

export const URL = {
  TRAINING_TEMPLATE: 'training-template',
  MODEL_TRAINING_EXECUTION: 'model-training-execution',
  ASSET: 'asset',
  MODEL_PREDICTION: 'model-prediction',
}

export const DATEFORMAT = 'YYYY-MM-DD'
export const DATETIMEFORMAT = 'YYYY-MM-DD HH:mm:ss'

export const ENTITY = {
  ASSET: 'asset',
  TRAINING_TEMPLATE: 'training-template',
  MODEL_TRAINING_EXECUTION: 'model-training-execution',
  MODEL_PREDICTION: 'model-prediction',
}
