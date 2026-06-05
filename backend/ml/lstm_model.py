from pathlib import Path

import matplotlib
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report

matplotlib.use("Agg")
import matplotlib.pyplot as plt


LABELS = ["normal", "pre_shock", "shock", "recovering"]
SAVED_MODELS_DIR = Path("ml") / "saved_models"

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

    def _save_training_plots(self, history):
        try:
            SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
            epochs = range(1, len(history.history.get("accuracy", [])) + 1)

            plt.figure(figsize=(10, 6))
            plt.plot(epochs, history.history.get("accuracy", []), color="blue", label="Training accuracy")
            plt.plot(
                epochs,
                history.history.get("val_accuracy", []),
                color="orange",
                label="Validation accuracy",
            )
            plt.xlabel("epochs")
            plt.ylabel("accuracy")
            plt.title("Training vs Validation Accuracy")
            plt.legend()
            plt.tight_layout()
            accuracy_path = SAVED_MODELS_DIR / "accuracy_curve.png"
            plt.savefig(accuracy_path)
            plt.close()
            print(f"Accuracy curve saved to {accuracy_path}")

            plt.figure(figsize=(10, 6))
            plt.plot(epochs, history.history.get("loss", []), color="blue", label="Training loss")
            plt.plot(
                epochs,
                history.history.get("val_loss", []),
                color="orange",
                label="Validation loss",
            )
            plt.xlabel("epochs")
            plt.ylabel("loss")
            plt.title("Training vs Validation Loss")
            plt.legend()
            plt.tight_layout()
            loss_path = SAVED_MODELS_DIR / "loss_curve.png"
            plt.savefig(loss_path)
            plt.close()
            print(f"Loss curve saved to {loss_path}")
        except Exception as exc:
            print(f"Failed to save training plots: {exc}")

    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        try:
            if self.model is None:
                self.build()
            if len(X_train) == 0 or len(X_val) == 0:
                raise ValueError("Training and validation data cannot be empty")

            checkpoint_path = SAVED_MODELS_DIR / "lstm_v1.h5"
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
            self._save_training_plots(history)

            predictions = self.model.predict(X_val, verbose=0)
            pred_classes = np.argmax(predictions, axis=1)
            print(
                classification_report(
                    y_val,
                    pred_classes,
                    target_names=LABELS,
                    zero_division=0,
                )
            )
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
