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

import { InvokeModelEndpointPayload, ModelTrainingExecutionData } from '../models'
import { CrudService } from './base/crudService'
import { appvars } from '../config'
import { API } from '@aws-amplify/api'

export class ModelTrainingExecutionSvc extends CrudService<ModelTrainingExecutionData> {
  async startModelTraining(modelTrainingExecutionId: string): Promise<ModelTrainingExecutionData> {
    try {
      const updatedData: any = await API.post(
        appvars.BACKENDVARS.API_DS_NAME,
        `/${appvars.ENDPOINT.ML}/pipeline-execution`,
        {
          body: {
            executionId: modelTrainingExecutionId,
          },
        },
      )

      return updatedData as ModelTrainingExecutionData
    } catch (err) {
      console.error(`[api::${this.serviceName}::startModelTraining] Error while starting the model training`, err)
      throw err
    }
  }

  async createModelEndpoint(modelTrainingExecutionId: string): Promise<ModelTrainingExecutionData> {
    try {
      const updatedData: any = await API.post(
        appvars.BACKENDVARS.API_DS_NAME,
        `/${appvars.ENDPOINT.ML}/model-endpoint`,
        {
          body: {
            executionId: modelTrainingExecutionId,
          },
        },
      )

      return updatedData as ModelTrainingExecutionData
    } catch (err) {
      console.error(`[api::${this.serviceName}::createModelEndpoint] Error while starting the model endpoint`, err)
      throw err
    }
  }

  async invokeModelEndpoint(payload: InvokeModelEndpointPayload): Promise<void> {
    try {
      const invokeResult: any = await API.post(
        appvars.BACKENDVARS.API_DS_NAME,
        `/${appvars.ENDPOINT.ML}/invoke-endpoint`,
        {
          body: {
            executionId: payload.executionId,
            quantiles: payload.quantiles,
            numSamples: payload.numSamples,
          },
        },
      )

      return
    } catch (err) {
      console.error(`[api::${this.serviceName}::invokeModelEndpoint] Error while invoking the model endpoint`, err)
      throw err
    }
  }

  async deleteModelEndpoint(modelTrainingExecutionId: string): Promise<void> {
    try {
      await API.del(
        appvars.BACKENDVARS.API_DS_NAME,
        `/${appvars.ENDPOINT.ML}/model-endpoint/${modelTrainingExecutionId}`,
        {},
      )
    } catch (err) {
      console.error(`[api::${this.serviceName}::deleteModelEndpoint] Error while deleting the model endpoint`, err)
      throw err
    }
  }
}

export const ModelTrainingExecutionService = new ModelTrainingExecutionSvc(
  'model-training-execution',
  appvars.ENDPOINT.MODEL_TRAINING_EXECUTION,
  {
    listHook: (list: ModelTrainingExecutionData[]): ModelTrainingExecutionData[] => {
      list.forEach((item) => {
        if (item.pipelineStepStatusChanges != null && item.pipelineExecStatusChanges != null) {
          const lastStep = item.pipelineStepStatusChanges[item.pipelineStepStatusChanges.length - 1]
          const firstExec = item.pipelineExecStatusChanges[0]
          const lastExec = item.pipelineExecStatusChanges[item.pipelineExecStatusChanges.length - 1]

          item.modelTrainingExecutionStatus = {
            execStatus: lastExec.currentPipelineExecutionStatus,
            stepStatus: lastStep.currentStepStatus,
            stepType: lastStep.stepType,
            startTime: firstExec.executionStartTime,
            endTime: lastExec.executionEndTime,
          }
        }
      })

      return list
    },
  },
)
