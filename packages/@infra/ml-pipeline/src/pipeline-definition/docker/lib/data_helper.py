import jsonpickle

# :: Split training and testing dataset
def get_train_test_split(in_df, predicted_asset):
    X = in_df.copy(deep=True)
    y = X[predicted_asset]
    X.drop(predicted_asset, axis=1, inplace=True)
    X.drop('Date', axis=1, inplace=True)
    
    train_samples = int(X.shape[0] * 0.7) + 1
 
    X_train = X.iloc[:train_samples]
    X_test = X.iloc[train_samples:]

    y_train = y.iloc[:train_samples]
    y_test = y.iloc[train_samples:]
    
    return (X_train, y_train), (X_test, y_test)

# :: persist plots in S3 bucket
def save_and_upload_plot(plt, s3_client, exec_id, outputTmpDir, filename):
    local_file = f"{outputTmpDir}/{filename}"
    plt.savefig(local_file)
    s3_client.uploadDiagram(exec_id, filename, local_file)

# :: write JSON-line format into local file
def write_dicts_to_file(path, data):
    with open(path, "wb") as fp:
        for d in data:
            fp.write(jsonpickle.encode(d).encode("utf-8"))
            fp.write("\n".encode("utf-8"))