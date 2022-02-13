import os
import xgboost as xgb
import boto3
import sagemaker
import sagemaker.session
from sagemaker.estimator import Estimator
from sagemaker.inputs import TrainingInput, CreateModelInput
from sagemaker.model import Model
from sagemaker.model_metrics import MetricsSource, ModelMetrics
from sagemaker.processing import ProcessingInput, ProcessingOutput, ScriptProcessor
from sagemaker.workflow.condition_step import ConditionStep, JsonGet
from sagemaker.workflow.conditions import ConditionGreaterThanOrEqualTo
from sagemaker.workflow.parameters import ParameterInteger, ParameterString, ParameterFloat
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.properties import PropertyFile
from sagemaker.workflow.step_collections import RegisterModel
from sagemaker.workflow.steps import ProcessingStep, TrainingStep, CreateModelStep


def get_sagemaker_session(region, default_bucket):
    """Gets the sagemaker session based on the region.

    Args:
        region: the aws region to start the session
        default_bucket: the bucket to use for storing the artifacts

    Returns:
        `sagemaker.session.Session` instance
    """

    boto_session = boto3.Session(region_name=region)

    sagemaker_client = boto_session.client("sagemaker")
    sagemaker_runtime_client = boto_session.client("sagemaker-runtime")
    sagemaker_session = sagemaker.session.Session(
        boto_session=boto_session,
        sagemaker_client=sagemaker_client,
        sagemaker_runtime_client=sagemaker_runtime_client,
        default_bucket=default_bucket,
    )

    return sagemaker_session


def create_pipeline(
    region,
    pipeline_name,
    default_bucket,
    pipeline_bucket_name,
    processing_image_uri,
    container_env,
    base_job_prefix="asset-prediction-example",
    role=None,
):
    """Creates a SageMaker ML Pipeline instance.

    Args:
        region: AWS region to create and run the pipeline.
        pipeline_name: The name of the pipeline.
        default_bucket: The bucket to use for storing the artifacts.
        pipeline_bucket_name: The bucket that stores code for the pipeline
        training_image_uri: The ECR URI of the training docker image.
        container_env: The environment variables dict to pass to the docker container.
        base_job_prefix: Job prefix string.
        role: IAM role ARN representing the pipeline execution role.

    Returns:
        An instance of a pipeline
    """
    sagemaker_session = get_sagemaker_session(region, default_bucket)
    if role is None:
        role = sagemaker.session.get_execution_role(sagemaker_session)

    #######################
    # PIPELINE PARAMETERS #
    #######################
    processing_instance_count = ParameterInteger(name="ProcessingInstanceCount", default_value=1)
    processing_instance_type = ParameterString(
        name="ProcessingInstanceType", default_value="ml.m5.xlarge"
    )
    training_instance_type = ParameterString(
        name="TrainingInstanceType", default_value="ml.m5.xlarge"
    )

    input_execution_id = ParameterString(name="ExecutionId")
    input_assets_data = ParameterString(name="AssetsData", default_value="")

    input_hyperparam_time_freq = ParameterString(name="HyperParamTimeFreq", default_value="1D")
    input_hyperparam_epochs = ParameterString(name="HyperParamEpochs")
    input_hyperparam_early_stopping_patience = ParameterString(name="HyperParamEarlyStoppingPatience")
    input_hyperparam_mini_batch_size = ParameterString(name="HyperParamMiniBatchSize")
    input_hyperparam_learning_rate = ParameterString(name="HyperParamLearningRate")
    input_hyperparam_context_length = ParameterString(name="HyperParamContextLength")
    input_hyperparam_prediction_length = ParameterString(name="HyperParamPredictionLength")
    input_model_package_group_name = ParameterString("ModelPackageGroupName")

    input_model_approval_status = ParameterString(
        name="ModelApprovalStatus",
        default_value="Approved", # ModelApprovalStatus can be set to a default of "Approved" if you don't want manual approval.
    )

    ############################
    # FEATURE ENGINEERING STEP #
    ############################
    feature_engineering_processor = sagemaker.processing.ScriptProcessor(
        role=role,
        image_uri=processing_image_uri,
        instance_type=processing_instance_type,
        instance_count=processing_instance_count,
        base_job_name=f"{base_job_prefix}/feature-engineering",
        sagemaker_session=sagemaker_session,
        volume_size_in_gb=30,
        env=container_env,
        command=["python3"]
    )

    step_feature_engineering = ProcessingStep(
        name="Feature-Engineering-Step",
        processor=feature_engineering_processor,
        code=f"s3://{pipeline_bucket_name}/code/executor/run-fe-step.py",
        job_arguments=["--executionid", input_execution_id],
        inputs=[
            ProcessingInput(source = input_assets_data, destination = '/opt/ml/processing/input/assets')
        ],
        outputs=[
            ProcessingOutput(output_name="train", source="/opt/ml/processing/train"),
            ProcessingOutput(output_name="test", source="/opt/ml/processing/test"),
            ProcessingOutput(output_name="features", source="/opt/ml/processing/features"),
        ],
    )
    
    # The feature importance extraction doesn't use DeepAR - it uses XGBoost and hence can be called in parallel to the previous 


    #######################
    # MODEL TRAINING STEP #
    #######################
    model_path = f"s3://{sagemaker_session.default_bucket()}/{base_job_prefix}/models"
    training_image_uri = sagemaker.image_uris.retrieve(
        framework="forecasting-deepar",
        region=region,
        py_version="py3",
        instance_type=training_instance_type,
    )

    print(f"training_image_uri = {training_image_uri}")
    estimator = Estimator(
        image_uri=training_image_uri,
        instance_type=training_instance_type,
        instance_count=1,
        output_path=model_path,
        base_job_name=f"{base_job_prefix}/training",
        sagemaker_session=sagemaker_session,
        role=role,
    )
    estimator.set_hyperparameters(
        time_freq = input_hyperparam_time_freq,
        epochs = input_hyperparam_epochs,
        early_stopping_patience = input_hyperparam_early_stopping_patience,
        mini_batch_size = input_hyperparam_mini_batch_size,
        learning_rate = input_hyperparam_learning_rate,
        context_length = input_hyperparam_context_length,
        prediction_length = input_hyperparam_prediction_length,
    )
    step_train = TrainingStep(
        name="AssetPrediction-Training-Step",
        # display_name=
        estimator=estimator,
        inputs={
            "train": TrainingInput(s3_data=step_feature_engineering.properties.ProcessingOutputConfig.Outputs["train"].S3Output.S3Uri),
            "test": TrainingInput(s3_data=step_feature_engineering.properties.ProcessingOutputConfig.Outputs["test"].S3Output.S3Uri),
        },
    )

    #####################
    # CREATE MODEL STEP #
    #####################
    model = Model(
        image_uri=training_image_uri,
        role=role,
        sagemaker_session=sagemaker_session,
        model_data=step_train.properties.ModelArtifacts.S3ModelArtifacts,
    )

    createmodel_inputs = CreateModelInput(
        instance_type='ml.m5.large'
    )

    step_createmodel = CreateModelStep(
        name='AssetPrediction-CreateModel-Step',
        model=model,
        inputs=createmodel_inputs
    )

    #######################
    # REGISTER MODEL STEP #
    #######################
    step_register = RegisterModel(
        name="AssetPredictionRegisterModel",
        estimator=estimator,
        model=model,
        model_data=step_train.properties.ModelArtifacts.S3ModelArtifacts,
        # TODO: review these
        content_types=["text/csv", "application/json", "application/jsonlines"],
        response_types=["text/csv", "application/json", "application/jsonlines"],
        inference_instances=["ml.t2.medium"],
        transform_instances=["ml.m5.large"],
        model_package_group_name=input_model_package_group_name,
        approval_status=input_model_approval_status
    )

    # Pipeline instance
    pipeline = Pipeline(
        name=pipeline_name,
        parameters=[
            processing_instance_type,
            processing_instance_count,
            training_instance_type,
            input_execution_id,
            input_assets_data,
            input_hyperparam_time_freq,
            input_hyperparam_epochs,
            input_hyperparam_early_stopping_patience,
            input_hyperparam_mini_batch_size,
            input_hyperparam_learning_rate,
            input_hyperparam_context_length,
            input_hyperparam_prediction_length,
            input_model_approval_status,
            input_model_package_group_name,
        ],
        steps=[
            step_feature_engineering,
            step_train,
            step_register,
            step_createmodel,
        ],
        sagemaker_session=sagemaker_session,
    )
    return pipeline
