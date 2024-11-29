# flake8: noqa

# typing imports and aliases

import seaborn as sns
import matplotlib.axes as Axes
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from typing import TypeAlias
from typing import Optional, Any

Number: TypeAlias = int | float

# import the required packages

# add utility functions from cohort and homework exercises


def normalize_z(array: np.ndarray,
                columns_means: Optional[np.ndarray] = None,
                columns_stds: Optional[np.ndarray] = None) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Normalize the input array using the Z-score normalization method.
    """
    if columns_means is None:
        columns_means = array.mean(axis=0)
    if columns_stds is None:
        columns_stds = array.std(axis=0)
    columns_means = np.array(columns_means)  # Convert to NumPy array
    columns_stds = np.array(columns_stds)    # Convert to NumPy array
    out = (array - columns_means) / columns_stds
    out = np.array(out)    # Convert to NumPy array
    return out, columns_means, columns_stds


def get_features_targets(df: pd.DataFrame,
                         feature_names: list[str],
                         target_names: list[str]) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Extract the features and targets from the input DataFrame.
    """
    df_feature = df.loc[:, feature_names]
    df_target = df.loc[:, target_names]
    return df_feature, df_target


def prepare_feature(np_feature: np.ndarray) -> np.ndarray:
    """
    Add a column of ones to the input array, representing beta_0.
    """
    return np.concatenate((np.ones((np_feature.shape[0], 1)), np_feature), axis=1)


def predict_linreg(array_feature: np.ndarray, beta: np.ndarray,
                   means: Optional[np.ndarray] = None,
                   stds: Optional[np.ndarray] = None) -> np.ndarray:
    """
    Predict the target values using the linear regression model.
    """
    n, _, _ = normalize_z(array_feature, means, stds)
    X = prepare_feature(n)
    return calc_linreg(X, beta)


def calc_linreg(X: np.ndarray, beta: np.ndarray) -> np.ndarray:
    """
    Calculate the linear regression model using the input feature matrix and beta values.
    """
    return np.matmul(X, beta)


def split_data(df_feature: pd.DataFrame,
               df_target: pd.DataFrame,
               random_state: Optional[int] = None,
               test_size: float = 0.5) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Split the input features and targets into training and testing sets.
    """
    row = len(df_feature)
    test = int(row*test_size)
    np.random.seed(random_state)
    test_index = np.random.choice(row, test, replace=False)

    df_feature_test = df_feature.iloc[test_index].reset_index(drop=True)
    df_target_test = df_target.iloc[test_index].reset_index(drop=True)

    df_feature_train = df_feature.drop(
        test_index, axis='index').reset_index(drop=True)
    df_target_train = df_target.drop(
        test_index, axis='index').reset_index(drop=True)
    return df_feature_train, df_feature_test, df_target_train, df_target_test


def r2_score(y: np.ndarray, ypred: np.ndarray) -> float:
    """
    Calculate the R-squared score of the model.
    """
    row = y.shape[0]
    mean = np.sum(y)/row
    tot = np.sum((y-mean)**2)
    res = np.sum((y-ypred)**2)
    return (1 - res/tot)


def mean_squared_error(target: np.ndarray, pred: np.ndarray) -> float:
    """
    Calculate the mean squared error of the model.
    """
    row = target.shape[0]
    return np.sum((target-pred)**2)/row


def mean_absolute_percentage_error(target: np.ndarray, pred: np.ndarray) -> float:
    """
    Calculate the mean absolute percentage error of the model.
    """
    row = target.shape[0]
    return np.sum(np.abs(target-pred)/target)/row


def compute_cost_linreg(X: np.ndarray, y: np.ndarray, beta: np.ndarray) -> np.ndarray:
    """
    Compute the cost of the linear regression model.
    """
    e = calc_linreg(X, beta) - y
    m = e.shape[0]
    J = (1/(2*m)) * np.matmul(np.transpose(e), e)
    return np.squeeze(J)


def gradient_descent_linreg(X: np.ndarray, y: np.ndarray, beta: np.ndarray,
                            alpha: float, num_iters: int) -> tuple[np.ndarray, np.ndarray]:
    """
    Perform gradient descent to find the optimal beta values.
    """
    J_storage = []
    for i in range(num_iters):
        m = X.shape[0]
        J_storage.append(compute_cost_linreg(X, y, beta))
        y_hat = calc_linreg(X, beta)
        beta = beta - np.matmul((alpha * (1/m)) * np.transpose(X), (y_hat-y))
    return beta, np.array(J_storage)


class Regressor():
    def __init__(self, df: pd.DataFrame, feature_names: list[str], target_names: list[str], test_size: float = 0.5, random_state: Optional[int] = 69):
        self.df = df

        df_features, df_target = get_features_targets(
            self.df, feature_names, target_names)

        # split the dataset into training and testing sets
        df_features_train, df_features_test, df_target_train, df_target_test = split_data(
            df_features, df_target, random_state, test_size)

        self.df_features_train = df_features_train
        self.df_features_test = df_features_test
        self.df_target_train = df_target_train
        self.df_target_test = df_target_test

        # normalize the features
        np_features_train, means, stds = normalize_z(
            self.df_features_train.to_numpy())

        self.np_features_train = np_features_train
        self.means = means
        self.stds = stds
        self.beta = np.zeros((np_features_train.shape[1], 1))

    def fit(self, iterations: int = 10000, alpha: float = 0.01):

        # prepare the features
        X = prepare_feature(self.np_features_train)
        target = self.df_target_train.to_numpy()
        beta = np.zeros((X.shape[1], 1))
        beta, J_storage = gradient_descent_linreg(
            X, target, beta, alpha, iterations)

        self.beta = beta

        return beta, J_storage

    def score(self):
        ypred = predict_linreg(
            self.df_features_test.to_numpy(), self.beta, self.means, self.stds)
        yactual = self.df_target_test.to_numpy()
        r2 = r2_score(yactual, ypred)
        mse = mean_squared_error(yactual, ypred)
        mape = mean_absolute_percentage_error(yactual, ypred)
        return r2, mse, mape
