# Model Training Concepts

This section describes the details of how the project enables users to have full control over customization of their model training process.

## Model training template

All the parameters that are used in any step in the automated pipeline execution is set up and stored in a model training template.

This includes parameters for the _Feature engineering_ part as well as the _Model training_ part.

Feature engineering parameters are helping to select which assets we want to include as features, as well as to generate technical analysis, arima and FFT features.

Model training parameters are helping to set hyperparameters that are passed to the estimator, and the time window used for training and test data.

## Model Training Execution

A model training execution represents a model training process with a selected model training template. Logs, changes, status information that are recorded during the pipeline execution process and other user activities are persisted in the model training execution item in DynamoDB.

Once the pipeline execution is finished, users can initiate to create an endpoint for the model that has been registered, then they can run model inference against it. Inference results are stored in the `model-prediction` DynamoDB table.

If the user doesn't manually shut down the model endpoint, an automated process, that runs every 60 minutes, will detect if there is an endpoint that hasn't been used for a certain amount of time (default 60 mins) and it will automatically remove the endpoint to avoid additional charges on the user's AWS account.

## Potential improvements

In improved/production environment an improvement could be keeping the templates, but adding the capability to override _some_ parameters from the template (and store these overrides in the training instance entity). That way there wouldn't be a need of a 1-1 relationship between training template and training execution and also it could provide a better traceability of what parameters were used for a training. In the current implementation if a template is updated after training a model with a set of parameters from a template, there is no capability to trace the changes.