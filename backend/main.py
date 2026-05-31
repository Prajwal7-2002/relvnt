from pathlib import Path

import pandas as pd
from fastapi import FastAPI

from ml.data_generator import generate_creator_dataset
from ml.lstm_model import LSTMModel
from ml.preprocessor import DataPreprocessor
from services.instagram_api import get_90_days_reach


app = FastAPI(title="Relvnt", version="0.1.0")

MODEL_PATH = Path("ml") / "saved_models" / "lstm_v1.h5"
PREPROCESSOR_PATH = Path("ml") / "saved_models" / "preprocessor_v1.pkl"


def print_health_report(result):
    print("=" * 32)
    print("   RELVNT HEALTH REPORT")
    print("   @prajwal_p_7")
    print("=" * 32)
    print(f"   Health Score:    {result['health_score']}/100")
    print(f"   Status:          {result['alert_level']}")
    print(f"   Prediction:      {result['prediction']}")
    print(f"   Confidence:      {result['confidence']}")
    print("-" * 32)
    print("   ACTION REQUIRED:")
    print(f"   {result['recommended_action']}")
    print("=" * 32)


def train_layer_one_model(epochs=50):
    try:
        df = generate_creator_dataset()
        if df.empty:
            raise ValueError("Synthetic training data is empty")

        preprocessor = DataPreprocessor()
        X_train, X_test, y_train, y_test = preprocessor.fit_transform(df)

        lstm = LSTMModel()
        lstm.build()
        lstm.train(X_train, y_train, X_test, y_test, epochs=epochs)

        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        lstm.save_model(str(MODEL_PATH))
        preprocessor.save(str(PREPROCESSOR_PATH))
        return df, preprocessor, lstm
    except Exception as exc:
        print(f"Layer 1 training failed: {exc}")
        raise


def load_or_train_model():
    try:
        preprocessor = DataPreprocessor()
        lstm = LSTMModel()

        if MODEL_PATH.exists() and PREPROCESSOR_PATH.exists():
            preprocessor.load(str(PREPROCESSOR_PATH))
            lstm.load_model(str(MODEL_PATH))
            return None, preprocessor, lstm

        print("Saved model or preprocessor not found. Training Layer 1 model.")
        return train_layer_one_model()
    except Exception as exc:
        print(f"Failed to load or train model: {exc}")
        raise


def get_prediction_input(fallback_df=None):
    try:
        real_df = get_90_days_reach()
        if real_df.empty:
            print("No Instagram data available. Using synthetic sample for demo.")
            if fallback_df is None or fallback_df.empty:
                fallback_df = generate_creator_dataset(n_creators=1)
            sample_df = fallback_df.tail(14).copy()
            return pd.to_numeric(sample_df["reach"], errors="coerce").fillna(0).values

        if len(real_df) < 14:
            raise ValueError("Instagram data must include at least 14 days")
        return real_df["reach"].values[-14:]
    except Exception as exc:
        print(f"Failed to prepare prediction input: {exc}")
        raise


def analyze_reach(preprocessor=None, lstm=None, fallback_df=None, print_report=True):
    try:
        if preprocessor is None or lstm is None:
            fallback_df, preprocessor, lstm = load_or_train_model()

        reach_values = get_prediction_input(fallback_df=fallback_df)
        X_real = preprocessor.transform(reach_values)
        result = lstm.predict_health_score(X_real)

        if print_report:
            print_health_report(result)
        return result
    except Exception as exc:
        print(f"Reach analysis failed: {exc}")
        raise


@app.get("/health")
def health():
    return {"status": "ok", "product": "Relvnt"}


@app.get("/analyze")
def analyze():
    return analyze_reach(print_report=False)


def main():
    print("Relvnt - Starting Layer 1 MVP")
    df, preprocessor, lstm = train_layer_one_model()
    analyze_reach(preprocessor=preprocessor, lstm=lstm, fallback_df=df)


if __name__ == "__main__":
    main()
