import boto3
import os
import time
import lib.config as config

class DDBClient:
    def __init__(self, *args, **kwargs):
        ddb = boto3.resource('dynamodb')
        self.assetsTable = ddb.Table(config.assetsTableName)
        self.templateTable = ddb.Table(config.templatesTableName)
        self.execTable = ddb.Table(config.executionsTableName)
        self.featureImportanceTable = ddb.Table(config.featureImportanceTableName)

    def listAssets(self):
        resp = self.assetsTable.scan()
        return resp['Items']

    def getTrainingExecutionItem(self, id):
        resp = self.execTable.get_item(
            Key={
                'Id': id
            }
        )

        return resp['Item']
    
    def getTrainingTemplate(self, id):
        resp = self.templateTable.get_item(
            Key={
                'Id': id
            }
        )

        return resp['Item']
    
    def updateExecItemStatus(self, id, status, logs = None):
        self.execTable.update_item(
            Key = { 'Id': id },
            UpdateExpression = "set #status = :status, #logs = :logs, #updatedAt = :updatedAt",
            ExpressionAttributeNames = {
                '#status': 'processingStepStatus',
                '#logs': 'processingStepLogs',
                '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues = {
                ':status': status,
                ':logs': logs,
                ':updatedAt': round(time.time() * 1000)
            }
        )

    def saveFeatureImportance(self, id, data):
        self.featureImportanceTable.update_item(
            Key = { 'Id': id },
            UpdateExpression = "set #data = :data, #updatedAt = :updatedAt",
            ExpressionAttributeNames = {
                '#data': 'data',
                '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues = {
                ':data': data,
                ':updatedAt': round(time.time() * 1000)
            }
        )