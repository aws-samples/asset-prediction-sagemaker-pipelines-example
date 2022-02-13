# # FEATURE ENGINEERING
# 
# 1. Fetch the list of all assets
# 2. Fetch the training template (ID will be an input parameter)
# 
# 3. Download each CSV file to temp dir
# 4. Merge all assets into one dataframe
# 
# 5. Build new features into the FE
# 
# 6. Store fully built FE CSV

import matplotlib.pyplot as plt
import numpy as np
import os
import pandas as pd 
import simplejson as json
from datetime import datetime
from datetime import timedelta

# Import internal helper packages
import lib.config as config
from lib.ddb import DDBClient
from lib.s3 import S3Client
import lib.logger as logger
import lib.data_helper as data_helper
import lib.feature_importance as feature_importance

logger.info(f"Contents of {config.ASSETS_DIR}: {len(os.listdir(config.ASSETS_DIR))} CSVs")

SEPARATOR = config.SEPARATOR
# ---

def run_step(exec_id):
    if not exec_id:
        raise Exception('exec_id parameter not set. Quitting...')

    ddbClient = DDBClient()
    s3Client = S3Client()

    # :: -
    logger.info(f"Model training execution started. exec_id={exec_id}")
    ddbClient.updateExecItemStatus(exec_id, 'RUNNING', logger.get_logs())

    try:
        # ---
        # create temp dir for plot outputs
        outputTmpDir = f"{config.outputTmpDirBase}/{exec_id}"
        if not os.path.exists(outputTmpDir):
            os.makedirs(outputTmpDir)

        # ### Fetch data from DDB
        # 
        # 1. Fetch the list of all assets
        # 2. Fetch the training template

        # :: get the assets list
        assets = ddbClient.listAssets()
        logger.info(f"{len(assets)} assets loaded from DB")

        # :: fetch execution instance and training template
        execution_instance = ddbClient.getTrainingExecutionItem(exec_id)
        template = ddbClient.getTrainingTemplate(execution_instance['templateId'])

        logger.info(f"Execution instance loaded (exec_id: {exec_id}), template loaded (template_id: {execution_instance['templateId']})")

        predicted_asset = template['predictedAsset']
        base_assets_ddb = template['feMeta']['baseAssets']
        
        assets_to_load_tickers = []

        if base_assets_ddb == 'all':
            assets_to_load_tickers = list(map(lambda x: x['ticker'], assets))
        else:
            tmp_all_assetsDF = pd.DataFrame(assets)
            tmp_assets_for_fft = list(tmp_all_assetsDF[tmp_all_assetsDF['assetClass'].isin(template['feMeta']['fftSettings']['assetClasses'])]['ticker'])
            base_assets_tickers = base_assets_ddb
            assets_to_load_tickers = list(np.unique(base_assets_tickers + template['feMeta']['taSettings']['assets'] + template['feMeta']['arimaSettings']['assets'] + tmp_assets_for_fft))

        logger.info(f"{len(assets_to_load_tickers)} assets set as base assets")

        # ---
        # 3. Merge all assets into one dataframe
        # :: load the CSVs with pandas
        mainDF = None

        assets_not_exist = []
        for asset_ticker in assets_to_load_tickers:
            asset_file = f"{config.ASSETS_DIR}/{asset_ticker}.csv"
            if not os.path.exists(asset_file):
                assets_not_exist.append(asset_ticker)
                continue

            df = pd.read_csv(asset_file)
            df.columns = ['Date', asset_ticker]
            
            if mainDF is None:
                mainDF = df
                continue

            mainDF = mainDF.merge(df, how='inner', on='Date')

        for to_remove in assets_not_exist:
            assets_to_load_tickers.remove(to_remove)

        # ---
        # :: stats
        assetClassStatAssets = [val for val in assets if val['ticker'] in assets_to_load_tickers]
        assetDF = pd.DataFrame(assetClassStatAssets)
        pd.DataFrame(assetDF.groupby('assetClass')['assetClass'].count()).rename(columns={'assetClass' : 'Count'}).reset_index().sort_values(by='Count', ascending=True).plot(kind='barh', x='assetClass', y='Count', figsize=(12, 7))
        data_helper.save_and_upload_plot(plt, s3Client, exec_id, outputTmpDir, 'assets-per-class.png')

        # ---
        # ### TECHNICAL ANALYSIS FEATURES

        # :: get the config
        taSettings = template['feMeta']['taSettings']
        assets_for_ta = taSettings['assets']
        logger.debug(f'Number of assets for technical indicators: {len(assets_for_ta)}.')

        # :: TA vars
        bb_window = int(taSettings['bollingerBand']['window'])
        bb_window_dev = int(taSettings['bollingerBand']['window_dev'])
        rsi_window = int(taSettings['rsi']['window'])
        sma_window = int(taSettings['sma']['window'])
        logger.debug(f"bb_window={bb_window} | bb_window_dev={bb_window_dev} | rsi_window={rsi_window} | sma_window={sma_window}")

        if taSettings['enabled']:

            from ta.volatility import BollingerBands
            from ta.momentum import RSIIndicator
            from ta.trend import SMAIndicator, EMAIndicator

            for asset_id in assets_for_ta:
                indicator_bb = BollingerBands(close=mainDF[asset_id], window=bb_window, window_dev=bb_window_dev)

                upCol = SEPARATOR.join([str(asset_id), 'BB', 'Up'])
                lowCol = SEPARATOR.join([str(asset_id), 'BB', 'Low'])
                maCol = SEPARATOR.join([str(asset_id), 'BB', 'MA'])
                rsiCol = SEPARATOR.join([str(asset_id), 'RSI'])
                smaCol = SEPARATOR.join([str(asset_id), 'SMA'])
                
                mainDF[upCol] = indicator_bb.bollinger_hband()
                mainDF[lowCol] = indicator_bb.bollinger_lband()
                mainDF[maCol] = indicator_bb.bollinger_mavg()
                
                rsa_indicator = RSIIndicator(close=mainDF[asset_id], window=rsi_window)
                mainDF[rsiCol] = rsa_indicator.rsi()

                sma_indicator = SMAIndicator(close=mainDF[asset_id], window=sma_window)
                mainDF[smaCol] = sma_indicator.sma_indicator()
                
                # clear NaNs from the beginning of the columns
                mainDF[[upCol, lowCol, maCol, rsiCol, smaCol]] = mainDF[[upCol, lowCol, maCol, rsiCol, smaCol]].fillna(axis='index', method='backfill')
            
            logger.info(f"Generated BB Up/Low/MA, RSI and SMA indicators for {len(assets_for_ta)} assets")
            ddbClient.updateExecItemStatus(exec_id, 'RUNNING', logger.get_logs())

        # ---
        # ### ARIMA FEATURES

        # :: get the config
        arimaSettings = template['feMeta']['arimaSettings']
        assets_for_arima = arimaSettings['assets']
        logger.debug(f'Number of assets for ARIMA: {len(assets_for_arima)}.')

        if arimaSettings['enabled']:

            from statsmodels.tsa.arima.model import ARIMA
            from sklearn.metrics import mean_squared_error

            for asset_id in assets_for_arima:

                X = mainDF[asset_id]
                size = int(len(X) * arimaSettings['trainSetSize'])
                train, test = X[0:size], X[size:len(X)]
                history = [x for x in train]
                predictions = list()
                model = ARIMA(history, order=(5,1,0))
        #         model_fit = model.fit(disp=0)
                model_fit = model.fit()
                for t in range(len(test)):
                    output = model_fit.forecast()
                    yhat = output[0]
                    predictions.append(yhat)
                    obs = list(test)[t]
                    history.append(obs)
                arimaColName = SEPARATOR.join([str(asset_id), 'ARIMA'])
                mainDF[arimaColName] = history
            
            logger.info(f"Generated ARIMA feature for {len(assets_for_arima)} assets")
            ddbClient.updateExecItemStatus(exec_id, 'RUNNING', logger.get_logs())

        # ---
        # ### FFT FEATURES

        fftSettings = template['feMeta']['fftSettings']
        asset_classes_for_fft = fftSettings['assetClasses']
        assets_for_fft = list(assetDF[assetDF['assetClass'].isin(asset_classes_for_fft)]['ticker'])
        logger.debug(f'Number of assets for Fourier transforms: {len(assets_for_fft)}.')

        if (fftSettings['enabled']):
            fft_num_comp = int(fftSettings['num_comp'])

            for asset_id in assets_for_fft:
                # discrete Fourier transformation
                close_fft = np.fft.fft(mainDF[asset_id])
                fft_df = pd.DataFrame({ 'fft': close_fft })
                # get abs and angle (both float64 output)
                fft_df['absolute'] = fft_df['fft'].apply(lambda x: np.abs(x))
                fft_df['angle'] = fft_df['fft'].apply(lambda x: np.angle(x))

                fft_list = np.asarray(fft_df['fft'].tolist())
                for num_ in fftSettings['num_steps']:
                    num = int(num_)
                    fft_list_m10 = np.copy(fft_list)
                    fft_list_m10[num:-num] = 0
                    
                    fftColName = SEPARATOR.join([str(asset_id), 'FT', str(num)])
                    mainDF[fftColName] = np.fft.ifft(fft_list_m10).real
                    
            logger.info(f"Generated {len(fftSettings['num_steps'])} FFT step features for {len(assets_for_fft)} assets")
            ddbClient.updateExecItemStatus(exec_id, 'RUNNING', logger.get_logs())

        # --- plot FFT components
        from collections import deque
        items = deque(np.asarray(fft_df['absolute'].tolist()))
        items.rotate(int(np.floor(len(fft_df)/2)))
        plt.figure(figsize=(15, 10), dpi=80)
        plt.stem(items)
        plt.title('Components of Fourier transforms')
        data_helper.save_and_upload_plot(plt, s3Client, exec_id, outputTmpDir, 'fft-components.png')

        # --- plot autocorrelation
        plt.figure(figsize=(8, 7), dpi=120)
        from pandas.plotting import autocorrelation_plot
        autocorrelation_plot(mainDF[predicted_asset])
        data_helper.save_and_upload_plot(plt, s3Client, exec_id, outputTmpDir, 'autocorrelation.png')

        # ---
        # ### AUTOENCODERS FEATURES
        logger.debug(f"NaN fields count {mainDF.isnull().sum().sum()}")

        # ---
        # Calculate feature importance
        feature_importance.calc_feature_importance(
            mainDF,
            assetDF,
            predicted_asset,
            exec_id,
            s3Client,
            ddbClient,
            outputTmpDir
        )

        # :: get config
        autoEncoderSettings = template['feMeta']['autoEncoderSettings']

        if (autoEncoderSettings['enabled']):
            
            (X_train, y_train), (X_test, y_test) = data_helper.get_train_test_split(mainDF.copy(deep=True), predicted_asset)
            
            logger.debug(f"mainDF dim: {len(list(mainDF.columns))}")
            logger.debug(f"training set dim: {len(list(X_train.columns))}")
            logger.debug(f"testing set dim: {len(list(X_test.columns))}")
            
            from tensorflow.keras.layers import Dense
            from tensorflow.keras.models import Sequential
            
            autoencoder = Sequential()
            
            x_dim = len(list(X_train.columns))
            autoencoder.add(Dense(600, activation='sigmoid', input_dim=x_dim))
            autoencoder.add(Dense(330, activation='relu', input_dim=600))
            autoencoder.add(Dense(x_dim, activation='relu', input_dim=330))
            autoencoder.add(Dense(330, activation='relu', input_dim=x_dim))
            autoencoder.add(Dense(600, activation='relu', input_dim=330))
            autoencoder.add(Dense(x_dim, activation='sigmoid', input_dim=600))
            
            autoencoder.compile(optimizer=autoEncoderSettings['optimizer'], loss=autoEncoderSettings['loss'])
            autoencoder.summary()
            
            history = autoencoder.fit(
                x=X_train,
                y=X_train,
                epochs=int(autoEncoderSettings['fitEpoch']),
                batch_size=int(autoEncoderSettings['fitBatchSize']),
                shuffle=bool(autoEncoderSettings['fitShuffle']),
                validation_data=(X_test, X_test),
                verbose=int(config.autoEncoderVerbose) # 0=silent
            )

            logger.info(f"Autoencoder ran successfully [{history}]")
            ddbClient.updateExecItemStatus(exec_id, 'RUNNING', logger.get_logs())

            # -- plot loss
            plt.plot(history.history['val_loss'], label='val_loss')
            # plt.plot(history.history['loss'], label='loss')
            plt.legend()
            plt.title('Validation loss of Autoencoders')
            plt.xlabel('Epoch')
            data_helper.save_and_upload_plot(plt, s3Client, exec_id, outputTmpDir, 'validation-loss-autoencoder.png')

            autoencoder_predictions = autoencoder.predict(mainDF.drop(['Date', predicted_asset], axis='columns', inplace=False).values)

            assert mainDF.shape[0] == autoencoder_predictions.shape[0], 'Something is wrong with merging data autoencoder features with the other features'

            autoencoder_predictions_df = pd.DataFrame(autoencoder_predictions)
            autoencoder_predictions_df['Date'] = mainDF['Date']
            featuresDF = mainDF.merge(autoencoder_predictions_df, left_on='Date', right_on='Date')
            # featuresDF.drop('Date',axis=1, inplace=True) # I DON'T SEE WHY WE NEED TO DO THIS

            logger.info(f"Number of records (trading days): {featuresDF.shape[0]:,.0f} (between {list(mainDF.head(1)['Date'])[0]} and {list(mainDF.tail(1)['Date'])[0]}).")
            logger.debug(f'Number of assets used: {len(assets_to_load_tickers)}.')
            logger.info(f'Number of technical features on assets: {mainDF.shape[1] - len(assets_to_load_tickers) - 1}.')
            logger.info(f'Number of synthetic features (AE): {autoencoder_predictions_df.shape[1] - 1}.')
            logger.info(f'Total number of features: {featuresDF.shape[1]}.')

            # features_local_file = f"{config.featuresTmpDir}/{exec_id}-features.csv"
            features_local_file = f"{config.baseDir}/features/features.csv"
            featuresDF.to_csv(features_local_file)
            s3Client.uploadFeatureCsv(exec_id, features_local_file)
            logger.info(f'Features CSV uploaded to {config.modelsBucketName}/{exec_id}/training/features.csv')

            featuresDF.set_index('Date', inplace=True)

            num_timeseries = featuresDF.shape[1]
            timeseries = []
            for i in range(num_timeseries):
                timeseries.append(np.trim_zeros(featuresDF.iloc[:, i], trim="f"))

            deepARMeta = template['deepARMeta']

            DATEFORMAT = '%Y-%m-%d'
            start_ds_ts = int(deepARMeta['startDataset'])/1000
            start_ds_date = datetime.utcfromtimestamp(start_ds_ts).strftime(DATEFORMAT)

            end_ts = int(deepARMeta['endTraining'])/1000
            end_date = datetime.utcfromtimestamp(end_ts).strftime(DATEFORMAT)

            freq = deepARMeta['freq'] # 1D

            start_dataset = pd.Timestamp(start_ds_date, freq=freq)
            end_training = pd.Timestamp(end_date, freq=freq)
            day_delta = pd.Timedelta(days=1)

            training_data = [
                {
                    "start": str(start_dataset),
                    "target": ts[str(start_dataset) : str(end_training - day_delta)].tolist(),
                    # We use -day_delta, because pandas indexing includes the upper bound
                }
                for ts in timeseries
            ]
            logger.info(f"Training data generated. Data length={len(training_data)}")

            num_test_windows = int(deepARMeta['testWindows'])
            prediction_length = int(deepARMeta['predictionLength'])

            test_data = [
                {
                    "start": str(start_dataset),
                    # TODO: sliding window instead of expanding window?
                    # "target": ts[str(start_dataset  + pd.Timedelta(days=k * prediction_length)) : str(end_training + pd.Timedelta(days=k * prediction_length))].tolist(),
                    "target": ts[str(start_dataset) : str(end_training + pd.Timedelta(days=k * prediction_length))].tolist(),
                }
                for k in range(1, num_test_windows + 1)
                for ts in timeseries
            ]
            logger.info(f"Test data generated. Test data length={len(test_data)}")

            # training_data_file_path = f"{config.featuresTmpDir}/train-{exec_id}.json"
            # test_data_file_path = f"{config.featuresTmpDir}/test-{exec_id}.json"
            training_data_file_path = f"{config.baseDir}/train/train.json"
            test_data_file_path = f"{config.baseDir}/test/test.json"

            data_helper.write_dicts_to_file(training_data_file_path, training_data)
            logger.info(f"Training data generated in JSON set as 'train' in ProcessingOutput at {training_data_file_path}")
            data_helper.write_dicts_to_file(test_data_file_path, test_data)
            logger.info(f"Test data generated in JSON set as 'test' in ProcessingOutput at {training_data_file_path}")

            ## upload to S3

            s3Client.uploadToModels(exec_id, 'data/train/train.json', training_data_file_path)
            logger.info(f"Training data generated in JSON line format and uploaded to {config.modelsBucketName}/{exec_id}/data/train/train.json")
            s3Client.uploadToModels(exec_id, 'data/test/test.json', test_data_file_path)
            logger.info(f"Test data generated in JSON line format and uploaded to {config.modelsBucketName}/{exec_id}/data/test/test.json")

            ddbClient.updateExecItemStatus(exec_id, 'FINISHED', logger.get_logs())
    except Exception as err:
        logger.error(f"Error while executing step: {str(err)}")
        ddbClient.updateExecItemStatus(exec_id, 'FAILED', logger.get_logs())

        raise err # throw it
