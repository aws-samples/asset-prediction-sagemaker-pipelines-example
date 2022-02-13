import argparse
import os
import shutil
import logging

logger = logging.getLogger('executor')
logger.setLevel(logging.INFO)

# get the parameters passed as "job_arguments"
parser = argparse.ArgumentParser()
parser.add_argument("--executionid", type=str, required=True)
args = parser.parse_args()

# exec_id represents the model training instance in DDB
exec_id = args.executionid

logger.info("job_arguments: %s", args)
logger.info("exec_id=%s", exec_id)

# code dir mapped to container
CODE_DIR='/opt/ml/processing/input/code'

# make the original code accessible to this executor
shutil.copy('/app/step_feature_engineering.py', os.path.join(CODE_DIR, 'step_feature_engineering.py'))
shutil.copytree('/app/lib', os.path.join(CODE_DIR, 'lib'))

logger.info("Original files copied to %s", CODE_DIR)
logger.info("Contents of %s: %s", CODE_DIR, os.listdir(CODE_DIR))

# import 1st step
import step_feature_engineering

# run step
step_feature_engineering.run_step(exec_id)
