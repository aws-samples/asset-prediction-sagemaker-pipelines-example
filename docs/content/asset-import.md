# Asset importer

We included a simple set of scripts that showcase how you can automatically import bulk assets into the system.
The example implements a process to download the component assets of the Dow Jones Industrial Average. The components list was taken from [this wikipedia page](https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average) and put into `apps/asset-import/downloader/tickers.csv`.

## Downloader

The downloader (`apps/asset-import/downloader`) is a simple `python` script that downloads the end-of-day close data of all the financial components mentioned above.

To run it, create a virtual environemnt and install `yfinance` and `pandas` packages, then run the script.

| *** IMPORTANT LEGAL DISCLAIMER *** |
| ---- |
| You should refer to Yahoo!'s terms of use ([here](https://policies.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.htm), [here](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html), and [here](https://policies.yahoo.com/us/en/yahoo/terms/index.htm)) for details on your rights to use the actual data downloaded. |
| Remember - the Yahoo! finance API is intended for personal use only. |

## Importer

The importer (`apps/asset-import`) is a simple `ts` script that will take the CSV files that contain the necessary data (refer to [asset data docs](./asset-data) on format).

Make sure you have review the config (`apps/asset-import/config/default.json`) and update if necessary.

Install the requirements and run it with the following command:

```zsh
yarn install
yarn importcsv
```

