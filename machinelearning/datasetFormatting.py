import pandas as pd
from sklearn.model_selection import train_test_split


def show_data(df):
    """
    Shows the data.
    :param df: Dataframe.
    :return: None.
    """
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    print(df.head())

    print("\nDataframe info: ")
    print(df.info())

    print("\nDataframe unique: ")
    print(df.nunique())

    print("\nDataframe null count: ")
    print(df.isnull().sum())

    print("\nDataframe label counts: ")
    print(df["Email Type"].value_counts())


def main():
    df = pd.read_csv("./dataset/Phishing_Email.csv")

    print("\nRaw data: ")
    show_data(df)

    df.dropna(inplace=True)
    df["label"] = df["Email Type"].apply(lambda x: 1 if x == "Phishing Email" else 0)


    train_df, temp_test_df = train_test_split(df, test_size=0.2, random_state=42)
    val_df, test_df = train_test_split(temp_test_df, test_size=0.1, random_state=42)

    print("\n\n****** Train data: ******")
    show_data(train_df)

    print("\n\n******Test data: ******")
    show_data(test_df)

    print("\n\n******Validation data: ******")
    show_data(val_df)

    print(f"\n\nTraining set size: {len(train_df)}")
    print(f"Validation set size: {len(val_df)}")
    print(f"Test set size: {len(test_df)}")

    train_df.to_csv("./dataset/train.csv", index=False)
    val_df.to_csv("./dataset/validation.csv", index=False)
    test_df.to_csv("./dataset/test.csv", index=False)

if __name__ == "__main__":
    main()