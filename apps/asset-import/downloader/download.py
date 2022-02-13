import yfinance as yf
import pandas as pd
import os

# read ticker data
# original table: https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average
df_original = pd.read_csv('./tickers.csv')
ticker_list = df_original['Symbol'].tolist()

# download ticker data for the last 20 years
print("Downloading DOW tickers")
data = yf.download(
    tickers = ticker_list,
    period = "20y",
    interval = "1d",
    group_by = 'ticker',
    auto_adjust = True,
    prepost = False,
    threads = True,
    proxy = None
)

# prep dir for download
os.makedirs('./dow-assets/tickers', exist_ok=True)

# export asset "classes"
df_original[['Symbol', 'Industry', 'Company']].to_csv(f'./dow-assets/asset-classes.csv', index=False)

# save EOD data to separate CSVs
print("Saving to ./dow-assets folder: ")
df_data = pd.DataFrame(data)
for idx in range(len(ticker_list)):
    ticker = ticker_list[idx]
    df_ticker = df_data[ticker]['Close']
    df_ticker.bfill(inplace=True)
    df_ticker.ffill(inplace=True)
    df_ticker.to_csv(f'./dow-assets/tickers/{ticker}.csv')
    print(f'{ticker}.csv', end=', ')

print("Done.")