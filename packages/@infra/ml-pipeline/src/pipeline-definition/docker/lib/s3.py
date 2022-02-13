import boto3
import logging
import os
import shutil
import lib.config as config

class S3Client:
    def __init__(self, *args, **kwargs):
        s3 = boto3.resource('s3')
        self.assetsBucket = s3.Bucket(config.assetsBucketName)
        self.modelsBucket = s3.Bucket(config.modelsBucketName)
        
        # make sure /tmp/assets exists:
        if os.path.exists(config.assetsTmpDir):
            shutil.rmtree(config.assetsTmpDir)
            logging.debug(f"{config.assetsTmpDir} wiped...")
        
        os.makedirs(config.assetsTmpDir)
        
        if not os.path.exists(config.featuresTmpDir):
            os.makedirs(config.featuresTmpDir)

    def downloadAsset(self, asset):
        filename = f"{asset['ticker']}.csv"
        logging.debug(f"Downloading {asset['bucketKey']} from bucket {config.assetsBucketName}")
        self.assetsBucket.download_file(asset['bucketKey'], f"{config.assetsTmpDir}/{filename}")

    def uploadToModels(self, exec_id, bucket_key, local_file):
        self.modelsBucket.upload_file(local_file, f"execution/{exec_id}/{bucket_key}")
        
    def uploadFeatureCsv(self, exec_id, local_file):
        self.uploadToModels(exec_id, 'training/features.csv', local_file)

    def uploadDiagram(self, exec_id, filename, local_file):
        self.uploadToModels(exec_id, f'plots/{filename}', local_file)