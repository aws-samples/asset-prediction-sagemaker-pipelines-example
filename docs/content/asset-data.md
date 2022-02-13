# Asset data

The current implementation of the project handles financial asset data as the following:

* Each financial asset's **End-of-day** data is stored in a `CSV` file, with two columns:
    1. Date - Represents the date of the data record in a `YYYY-MM-DD` format
    2. Close - Represents the end-of-day value

* Each financial asset's `CSV` file is stored in an S3 bucket, and its metadata is maintained in sync in a DynamoDB table.

## Asset data - Shortcomings, path to production

### Normalization

* As an improvement for the machine learning model training, the values for the end-of-day information may need to be **normalized** between `0.0` and `1.0`. Meaning that whenever the original dataset is updated, the current CSV values should be re-calculated.
  * For normalization, we'd use the following equation: `calculated_value = (original_value - min) / (max - min)`

### Data overlap

In the current implementation we expect that each CSV file contains the same amount of data: same start dates, same end dates, same number of records, data on the same trading days.

In an improved/production environment, these requirements may not be able fulfilled. Hence, we recommend to introduce a mechanism, where once all the selected assets are calculated for the feature engineering step, the system provides feedback to the user with the available _overlapping time frame_ where all selected assets contain end-of-day data, and, the model training start and end dates can be selected only from this overlapping time frame.

For missing data, there may be a mechanism to be introduced to automatically backfill data if that won't affect the model inference outcome significantly.

### Data storage, normalization

In an improved environment/path to production, storing the underlying financial assets' values could be changed from CSVs to other methods, such as
* No-SQL: e.g. DynamoDB (with a Global Secondary Index on the timestamp),
* SQL/relational database: e.g. Amazon Aurora (with index on timestamp),
* or **Timeseries database**: e.g. Amazon TimeStream.

As for simplicity, the assets' values and timestamps should be stored AS-IS, and the data normalization would be a preliminary step right in the beginning of the _feature engineering processing step of the pipeline_, when all the data is loaded.

This would also simplify querying asset data, detecting gaps in overlaps, etc.

### Live data feed integration

Once the storage layer is switched from normalized CSV files to database engines, integrating with live data sources such as end-of-day services, brokerage data feeds, etc, would open the ability to update each and every financial asset's data. Storing the values and timestamps as-is, would enable to simply extend all the datasources and have the ability to predict future values of various assets.

Live data feed integration implementation could be provided in various ways, depending on the interface of the original data feed:

  * scheduled updates: e.g.: schedule a serverless lambda function execution every day after market close
  * callback url: provide an API gateway endpoint with proper security filters (e.g. WAF) to be called by a third party service as a callback to push data into the system
  * websocket/socket communication: for more granular data there may be an option to keep a live feed/connection with various data providers and capture the incoming data incrementally
