from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = PROJECT_ROOT / "data" / "synthetic" / "training_data.csv"


def generate_creator_dataset(n_creators=500, days=180, seed=42):
    try:
        if days != 180:
            raise ValueError("Layer 1 generator expects days=180")
        if n_creators <= 0:
            raise ValueError("n_creators must be greater than 0")

        np.random.seed(seed)
        base_reach_options = [3000, 5000, 10000, 25000, 50000]
        rows = []

        for creator_id in range(n_creators):
            base_reach = int(np.random.choice(base_reach_options))

            normal = np.random.normal(base_reach, base_reach * 0.06, 100)
            pre_shock = np.linspace(base_reach, base_reach * 0.85, 20)
            pre_shock += np.random.normal(0, base_reach * 0.03, 20)
            shock = np.linspace(base_reach * 0.85, base_reach * 0.45, 25)
            shock += np.random.normal(0, base_reach * 0.03, 25)
            recovery = np.random.normal(base_reach * 0.50, base_reach * 0.04, 35)

            reach_values = np.concatenate([normal, pre_shock, shock, recovery])
            labels = np.array([0] * 100 + [1] * 20 + [2] * 25 + [3] * 35)
            reach_values = np.clip(reach_values, 0, None)

            for day, reach, label in zip(range(days), reach_values, labels):
                rows.append(
                    {
                        "creator_id": creator_id,
                        "day": day,
                        "reach": int(round(float(reach))),
                        "label": int(label),
                    }
                )

        df = pd.DataFrame(rows, columns=["creator_id", "day", "reach", "label"])
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(OUTPUT_PATH, index=False)

        print(f"Generated {len(df)} rows for {n_creators} creators")
        print("Label distribution:")
        print(df["label"].value_counts().sort_index().to_string())
        return df
    except Exception as exc:
        print(f"Failed to generate synthetic dataset: {exc}")
        return pd.DataFrame(columns=["creator_id", "day", "reach", "label"])


if __name__ == "__main__":
    generate_creator_dataset()
