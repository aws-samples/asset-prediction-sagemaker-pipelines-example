from lib2to3.pgen2.token import NAME
import os

SEPARATOR = '_'

assetsBucketName = os.environ.get('S3_ASSETS_BUCKET')
modelsBucketName = os.environ.get('S3_MODELS_BUCKET')
assetsPrefix = os.environ.get('ASSETS_KEY_PREFIX', 'assets/csv')

baseDir = '/opt/ml/processing'

# processing step ASSET data input
ASSETS_DIR='/opt/ml/processing/input/assets'

assetsTmpDir = '/tmp/assets'
featuresTmpDir = '/tmp/features'
outputTmpDirBase = '/tmp/output'

# make sure /tmp/output exists:
if not os.path.exists(outputTmpDirBase):
    os.makedirs(outputTmpDirBase)

assetsTableName = os.environ.get('DDB_ASSETS_TABLE')
templatesTableName = os.environ.get('DDB_TEMPLATES_TABLE')
executionsTableName = os.environ.get('DDB_EXECUTIONS_TABLE')
featureImportanceTableName = os.environ.get('DDB_FEATURE_IMPORTANCE_TABLE')

autoEncoderVerbose = os.environ.get('FE_AUTOENCODER_VERBOSE', '0')