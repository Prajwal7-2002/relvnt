import joblib
import numpy as np
from sklearn.preprocessing import MinMaxScaler


class DataPreprocessor:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.window_size = 14
        self.random_seed = 42
        self.is_fitted = False

    def create_sequences(self, data, labels):
        try:
            X, y = [], []
            for i in range(len(data) - self.window_size):
                X.append(data[i : i + self.window_size])
                y.append(labels[i + self.window_size])
            return np.array(X), np.array(y)
        except Exception as exc:
            print(f"Failed to create sequences: {exc}")
            return np.array([]), np.array([])

    def fit_transform(self, df):
        try:
            required_columns = {"reach", "label"}
            missing = required_columns.difference(df.columns)
            if missing:
                raise ValueError(f"Missing required columns: {sorted(missing)}")
            if len(df) <= self.window_size:
                raise ValueError("Not enough rows to create training sequences")

            reach = df["reach"].astype(float).values.reshape(-1, 1)
            scaled_reach = self.scaler.fit_transform(reach)
            self.is_fitted = True

            scaled_df = df.copy()
            scaled_df["scaled_reach"] = scaled_reach.reshape(-1)

            if "creator_id" in scaled_df.columns:
                X_parts, y_parts = [], []
                for _, creator_df in scaled_df.groupby("creator_id", sort=False):
                    creator_df = creator_df.sort_values("day") if "day" in creator_df.columns else creator_df
                    creator_data = creator_df["scaled_reach"].values.reshape(-1, 1)
                    creator_labels = creator_df["label"].astype(int).values
                    X_creator, y_creator = self.create_sequences(creator_data, creator_labels)
                    if len(X_creator) > 0:
                        X_parts.append(X_creator)
                        y_parts.append(y_creator)
                if not X_parts:
                    raise ValueError("No creator produced enough rows for sequences")
                X = np.concatenate(X_parts, axis=0)
                y = np.concatenate(y_parts, axis=0)
            else:
                labels = scaled_df["label"].astype(int).values
                X, y = self.create_sequences(scaled_reach, labels)

            if len(X) == 0:
                raise ValueError("Sequence creation produced no samples")

            np.random.seed(self.random_seed)
            indices = np.random.permutation(len(X))
            X, y = X[indices], y[indices]

            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            print(f"X_train shape: {X_train.shape}")
            print(f"X_test shape: {X_test.shape}")
            print(f"y_train shape: {y_train.shape}")
            print(f"y_test shape: {y_test.shape}")
            return X_train, X_test, y_train, y_test
        except Exception as exc:
            print(f"Failed to fit and transform data: {exc}")
            empty_X = np.empty((0, self.window_size, 1))
            empty_y = np.empty((0,), dtype=int)
            return empty_X, empty_X, empty_y, empty_y

    def transform(self, series):
        try:
            if not self.is_fitted:
                raise ValueError("Preprocessor is not fitted")

            values = np.asarray(series, dtype=float)
            if len(values) < self.window_size:
                raise ValueError("At least 14 reach values are required")

            recent_values = values[-self.window_size :].reshape(-1, 1)
            scaled = self.scaler.transform(recent_values)
            return scaled.reshape(1, self.window_size, 1)
        except ValueError:
            raise
        except Exception as exc:
            print(f"Failed to transform reach series: {exc}")
            raise

    def inverse_transform(self, scaled):
        try:
            return self.scaler.inverse_transform(scaled)
        except Exception as exc:
            print(f"Failed to inverse transform values: {exc}")
            raise

    def save(self, path):
        try:
            joblib.dump(self.scaler, path)
            print(f"Preprocessor saved to {path}")
        except Exception as exc:
            print(f"Failed to save preprocessor to {path}: {exc}")
            raise

    def load(self, path):
        try:
            self.scaler = joblib.load(path)
            self.is_fitted = True
            print(f"Preprocessor loaded from {path}")
        except Exception as exc:
            print(f"Failed to load preprocessor from {path}: {exc}")
            raise


if __name__ == "__main__":
    sample = np.arange(20)
    labels = np.zeros(20, dtype=int)
    preprocessor = DataPreprocessor()
    X, y = preprocessor.create_sequences(sample.reshape(-1, 1), labels)
    print(f"Created sample sequences: X={X.shape}, y={y.shape}")
