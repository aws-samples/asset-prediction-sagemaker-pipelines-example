import xgboost as xgb
import matplotlib.pyplot as plt
import pandas as pd

from . import logger
from . import data_helper
from . import config

SEPARATOR = config.SEPARATOR


def calc_feature_importance(
    mainDF, # DataFrame not containing synthetic features
    assetDF,
    predicted_asset,
    exec_id,
    s3_client,
    ddb_client,
    outputTmpDir
    ):

    try:
        features_df = mainDF.copy(deep = True)

        # Create 10 order lags of the target variable
        for i in range(1, 12):
            features_df[f'day_{i}_lag_of_{predicted_asset}'] = features_df[predicted_asset].shift(-i)

        features_df.dropna(inplace=True)
        
        # TEST
        features_df.drop(['Date'], axis='columns', inplace=True)
        
        y = features_df[predicted_asset].copy(deep=True)
        X = features_df.copy(deep=True)

        # Delete all features created by the target variable
        prefix = f"{predicted_asset}{SEPARATOR}"
        for fe_col in [x for x in X.columns if str(x).startswith(prefix)]:
            del X[fe_col]
        del X[predicted_asset]

        cut_off_train = int(X.shape[0] * 0.8)

        X_train = X.iloc[:cut_off_train, :]
        X_test = X.iloc[cut_off_train:, :]

        y_train = y.iloc[:cut_off_train]
        y_test = y.iloc[cut_off_train:]

        # Check the dimensions
        logger.info(f'[FI] Y train shape: {y_train.shape}, Y test shape: {y_test.shape}')
        
        # Check the dimensions
        logger.info(f'[FI] X train shape: {X_train.shape}, X test shape: {X_test.shape}')

        eval_set = [(X_train, y_train), (X_test, y_test)]
        eval_metric = ["rmse"]

        logger.info(f'[FI] Feature importance calculation starting...')

        model = xgb.XGBRegressor(n_estimators=10, max_depth=5)
        trained_model = model.fit(X_train._get_numeric_data(), y_train._get_numeric_data(), eval_set=eval_set,eval_metric=eval_metric, verbose=False)

        logger.info(f'[FI] Feature importance calculation finished.')

        feature_imp_df = pd.DataFrame({
            'feature' : list(X.columns),
            'importance' : list(trained_model.feature_importances_)
        })

        feature_imp_df = feature_imp_df.sort_values(by='importance', ascending=False)

        # Individual Feature Importance
        plt.figure(figsize=(20, 10), dpi=120)
        plt.barh(feature_imp_df.head(20).feature, feature_imp_df.head(20).importance)
        plt.title('Feature importance (top 20)')
        data_helper.save_and_upload_plot(plt, s3_client, exec_id, outputTmpDir, 'feat_imp_individual.png')

        # Asset class average importance
        assetDF['ticker'] = assetDF['ticker'].apply(lambda x: x.strip())
        assetDF['assetClass'] = assetDF['assetClass'].apply(lambda x: x.strip())

        asset_classes_dict = dict(zip(assetDF.ticker, assetDF.assetClass))

        feature_imp_df['base_asset'] = feature_imp_df['feature'].apply(lambda x: x.split(SEPARATOR)[0])
        feature_imp_df['asset_class'] = feature_imp_df['base_asset'].map(asset_classes_dict)

        asset_class_importance_df = pd.DataFrame(feature_imp_df.groupby(by='asset_class')['importance'].mean()).reset_index()

        plt.figure(figsize=(20, 10), dpi=120)
        plt.barh(asset_class_importance_df.asset_class, asset_class_importance_df.importance)
        plt.title('Feature importance (by asset class)')
        data_helper.save_and_upload_plot(plt, s3_client, exec_id, outputTmpDir, 'feat_imp_by_class.png')
        
        logger.info(f"[FI] Feature importance data saved to DDB table '{config.featureImportanceTableName}'")

        feature_imp_df.drop(['base_asset', 'asset_class'], axis='columns', inplace=True)

        ddb_client.saveFeatureImportance(exec_id, {
            'featureImportance': feature_imp_df.to_json(),
            'byAssetClass': asset_class_importance_df.to_json(),
        })

    except Exception as err:
        logger.error(f"[FI] Error while executing feature importance: {str(err)}")
        ddb_client.updateExecItemStatus(exec_id, 'FAILED', logger.get_logs())

        raise err # throw it