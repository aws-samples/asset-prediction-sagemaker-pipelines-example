# Asset Prediction Sagemaker Pipeline Example

> * For quick start guide, see [quickstart guide](./quickstart.md).

## Services, features of the project

* [Asset data](./content/asset-data.md)
* [Asset importer](./content/asset-import.md)
* [Model Training Concepts](./content/model-training.md)
* [Model Training Pipeline](./content/pipeline.md)
* [System events](./content/events.md)
* [User interface](./content/screenshots.md)
* [Security](./content/security.md)
* [Cost estimation](./content/cost.md)
* [Uninstall](./content/uninstall.md)

---

## End to end flow

1. Create asset entries and upload CSVs through the UI
1. Create a model training template and set all the parameters
1. Create a model training execution and set the template to use
1. Trigger model training with the `Start model training` button
1. Lambda function will call `startPipelineExecution` with the right parameters
1. Processing step performs the feature engineering step, stores features/test/training data in S3
1. Training step trains the model
1. Model gets created and registered with Sagemaker
1. Create model endpoint (and config) from the UI using the `Create endpoint` button
1. Run inference against model with parameters set on the UI
1. Analyze output from inference on a chart in the UI
1. Delete model endpoint manually or leave it and it will be automatically cleaned up after 60 minutes

----
