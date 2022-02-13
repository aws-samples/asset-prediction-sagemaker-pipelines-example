# System events and scheduling

To provide better visibility of what is happening throughout the model training process, the backend system subscribes to various events that are emitted from native Amazon/AWS services.

### Handlers

Every event that is triggered targets (runs) a lambda function, and further integration with other systems are out of the scope.

### Event types

We subscribe for the following events:

1. SageMaker Model Building Pipeline Execution Status Change
    * this event indicates when the _pipeline_ starts, succeeds or fails
  
1. SageMaker Model Building Pipeline Execution Step Status Change
    * this event indicates that a _pipeline step_ starts, succeeds or fails

1. SageMaker Model State Change
    * this event indicates that a _model_ is being created, registered, deleted

1. SageMaker Endpoint State Change
    * this event indicates if an _endpoint_ is being created, dropped, etc

1. Scheduled model endpoint auto-cleanup (every 60 mins)
    * this triggers an _automatic endpoint cleanup_ from SageMaker and also from the DynamoDB table where we stored it in the first place


## Potential improvements

In an improved/production environment it would be ideal to setup a scheduled execution of a list of model trainings so that new, incoming data (maybe bulk) can be integrated into the models.