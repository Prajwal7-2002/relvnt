from pathlib import Path

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = PROJECT_ROOT / "data" / "synthetic" / "training_data.csv"
LABEL_TARGETS = {0: 20000, 1: 20000, 2: 20000, 3: 20000}


def _creator_profile(rng):
    base_reach_options = [3000, 5000, 10000, 25000, 50000]
    base_reach = int(rng.choice(base_reach_options))
    creator_scale = rng.uniform(0.7, 1.4)
    weekly_amp = rng.uniform(0.01, 0.05)
    phase = rng.uniform(0, 2 * np.pi)
    return base_reach * creator_scale, weekly_amp, phase


def _weekly_pattern(weekly_amp, phase, days):
    day_index = np.arange(days)
    return 1 + weekly_amp * np.sin((2 * np.pi * day_index / 7) + phase)


def _generate_segment(rng, label, segment_len):
    base_reach, weekly_amp, phase = _creator_profile(rng)
    weekly = _weekly_pattern(weekly_amp, phase, segment_len)

    if label == 0:
        values = rng.normal(base_reach, base_reach * 0.03, segment_len)
    elif label == 1:
        decline = np.linspace(base_reach, base_reach * 0.70, segment_len)
        values = decline + rng.normal(0, base_reach * 0.02, segment_len)
    elif label == 2:
        decline = np.linspace(base_reach * 0.70, base_reach * 0.42, segment_len)
        values = decline + rng.normal(0, base_reach * 0.025, segment_len)
    elif label == 3:
        recovery = np.linspace(base_reach * 0.45, base_reach * 0.62, segment_len)
        values = recovery + rng.normal(0, base_reach * 0.025, segment_len)
    else:
        raise ValueError(f"Unknown label: {label}")

    return np.clip(values * weekly, 0, None)


def generate_creator_dataset(n_creators=500, days=180, seed=42):
    try:
        if n_creators <= 0:
            raise ValueError("n_creators must be greater than 0")

        rng = np.random.default_rng(seed)
        rows = []
        counts = {label: 0 for label in LABEL_TARGETS}
        creator_id = 0
        segment_len = 20

        while any(counts[label] < target for label, target in LABEL_TARGETS.items()):
            for label, target in LABEL_TARGETS.items():
                if counts[label] >= target:
                    continue

                rows_to_add = min(segment_len, target - counts[label])
                reach_values = _generate_segment(rng, label, rows_to_add)

                for day, reach in enumerate(reach_values):
                    rows.append(
                        {
                            "creator_id": creator_id,
                            "day": day,
                            "reach": int(round(float(reach))),
                            "label": label,
                        }
                    )

                counts[label] += rows_to_add
                creator_id += 1

        df = pd.DataFrame(rows, columns=["creator_id", "day", "reach", "label"])
        df = df.sort_values(["creator_id", "day"]).reset_index(drop=True)

        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(OUTPUT_PATH, index=False)

        print(f"Generated {len(df)} balanced rows")
        print("Label distribution:")
        print(df["label"].value_counts().sort_index().to_string())
        return df
    except Exception as exc:
        print(f"Failed to generate synthetic dataset: {exc}")
        return pd.DataFrame(columns=["creator_id", "day", "reach", "label"])


if __name__ == "__main__":
    generate_creator_dataset()
