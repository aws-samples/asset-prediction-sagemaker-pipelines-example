# `@infra/data-storage`

Data storage nested stack.

## Resources

This package creates the following persistent resources.

### DynamoDB tables

* `assetsMetadata` - metadata for timeseries data (csv)
* `trainingTemplate` - template for model trainings (parameter values)
* `modelTrainingExecution` - an execution instance of a model training
* `modelEndpointMaintenance` - model endpoint metadata
* `modelPrediction` - inference results for trained models
* `featureImportance` - feature importance results for models

### S3 buckets

* `assetsBucket` - assets storage (csv)
* `modelsBucket` - trained model storage
* `pipelineBucket` - sagemaker pipeline artifacts

## Usage

```ts
import { DataStorage } from '@infra/data-storage'

const dataStorage = new DataStorage(this, 'DataStorage', {
    modelTrainingsPipelineExecIndexName: 'pipelineExecutionArn-Index',
    modelEndpointArnIndexName: 'modelEndpointArn-Index'
})
```
