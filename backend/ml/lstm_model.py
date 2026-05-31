from pathlib import Path

import numpy as np
import tensorflow as tf


LABELS = ["normal", "pre_shock", "shock", "recovering"]

ACTIONS = {
    "normal": "Your reach is stable. Keep your current posting schedule.",
    "pre_shock": (
        "Early warning detected. Increase Reels to 4 per week. Post between "
        "7-9pm IST. Engage with every comment within 1 hour."
    ),
    "shock": (
        "Algorithm suppression detected. Post 1 Reel daily for 7 days. Use "
        "niche hashtags only. Engage heavily with comments."
    ),
    "recovering": (
        "Recovery in progress. Maintain consistent posting. Do not change "
        "content type. Post same time daily."
    ),
}


class LSTMModel:
    def __init__(self):
        self.model = None
        self.is_trained = False

    def build(self, input_shape=(14, 1), n_classes=4):
        try:
            model = tf.keras.Sequential(
                [
                    tf.keras.layers.LSTM(
                        64,
                        return_sequences=True,
                        input_shape=input_shape,
                        dropout=0.2,
                    ),
                    tf.keras.layers.LSTM(32, dropout=0.2),
                    tf.keras.layers.Dense(16, activation="relu"),
                    tf.keras.layers.Dense(n_classes, activation="softmax"),
                ]
            )

            model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                loss="sparse_categorical_crossentropy",
                metrics=["accuracy"],
            )

            self.model = model
            model.summary()
            return model
        except Exception as exc:
            print(f"Failed to build LSTM model: {exc}")
            raise

    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        try:
            if self.model is None:
                self.build()
            if len(X_train) == 0 or len(X_val) == 0:
                raise ValueError("Training and validation data cannot be empty")

            checkpoint_path = Path("ml") / "saved_models" / "lstm_v1.h5"
            checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            callbacks = [
                tf.keras.callbacks.EarlyStopping(
                    monitor="val_accuracy",
                    patience=5,
                    restore_best_weights=True,
                ),
                tf.keras.callbacks.ModelCheckpoint(
                    filepath=str(checkpoint_path),
                    save_best_only=True,
                    monitor="val_accuracy",
                    mode="max",
                ),
            ]

            history = self.model.fit(
                X_train,
                y_train,
                validation_data=(X_val, y_val),
                epochs=epochs,
                batch_size=64,
                callbacks=callbacks,
            )

            self.is_trained = True
            final_val_accuracy = history.history.get("val_accuracy", [0])[-1]
            final_val_loss = history.history.get("val_loss", [0])[-1]
            print("Training complete")
            print(f"Final val_accuracy: {final_val_accuracy:.4f}")
            print(f"Final val_loss: {final_val_loss:.4f}")
            return history
        except Exception as exc:
            print(f"Failed to train LSTM model: {exc}")
            raise

    def predict_health_score(self, X_sequence):
        try:
            if self.model is None or not self.is_trained:
                raise ValueError("Model must be trained or loaded before prediction")
            if X_sequence.shape != (1, 14, 1):
                raise ValueError("X_sequence must have shape (1, 14, 1)")

            probabilities = self.model.predict(X_sequence, verbose=0)[0]
            predicted_class = int(np.argmax(probabilities))
            confidence = float(np.max(probabilities))
            prediction_label = LABELS[predicted_class]

            if prediction_label == "normal":
                score = 70 + (confidence * 30)
            elif prediction_label == "pre_shock":
                score = 30 + ((1 - confidence) * 20)
            elif prediction_label == "shock":
                score = 5 + ((1 - confidence) * 25)
            else:
                score = 40 + (confidence * 20)

            score = max(0, min(100, int(round(score))))
            if score >= 70:
                alert_level = "green"
            elif score >= 40:
                alert_level = "yellow"
            else:
                alert_level = "red"

            return {
                "health_score": score,
                "alert_level": alert_level,
                "prediction": prediction_label,
                "confidence": round(confidence, 2),
                "recommended_action": ACTIONS[prediction_label],
            }
        except Exception as exc:
            print(f"Failed to predict health score: {exc}")
            raise

    def save_model(self, path):
        try:
            if self.model is None:
                raise ValueError("No model is available to save")
            self.model.save(path)
            print(f"Model saved to {path}")
        except Exception as exc:
            print(f"Failed to save model to {path}: {exc}")
            raise

    def load_model(self, path):
        try:
            self.model = tf.keras.models.load_model(path)
            self.is_trained = True
            print(f"Model loaded from {path}")
        except Exception as exc:
            print(f"Failed to load model from {path}: {exc}")
            raise


if __name__ == "__main__":
    model = LSTMModel()
    model.build()
