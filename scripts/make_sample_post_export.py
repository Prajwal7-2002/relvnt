"""Generate a sample per-post export shaped like Meta Business Suite's content export.

Scenario: ~5 posts/week, mostly reels, for two months; then the last four weeks
drop to ~2 posts/week, mostly photos, and reach per post falls.

Usage: python scripts/make_sample_post_export.py OUTPUT.csv
"""
import csv
import random
import sys
from datetime import datetime, timedelta

random.seed(7)
END = datetime(2026, 11, 2, 19, 0)
START = END - timedelta(days=90)
CUTOFF = END - timedelta(days=28)

HEADER = ["Post ID", "Account ID", "Account username", "Account name", "Description", "Duration (sec)",
          "Publish time", "Permalink", "Post type", "Data comment", "Date", "Views", "Reach", "Likes",
          "Shares", "Follows", "Comments", "Saves"]
TYPES = {"IG reel": 4200, "IG carousel": 2400, "IG image": 1300}
TOPICS = ["New menu item", "Behind the scenes", "Customer of the week", "Weekend special", "How we make it",
          "Festive offer", "Meet the team", "Morning routine", "Recipe tip", "Thank you post"]

rows, day, i = [], START, 0
while day <= END:
    recent = day > CUTOFF
    if random.random() < (0.3 if recent else 0.72):
        weights = [0.15, 0.2, 0.65] if recent else [0.6, 0.25, 0.15]
        ptype = random.choices(list(TYPES), weights=weights)[0]
        base = TYPES[ptype] * (1.35 if day.weekday() == 5 else 1.0) * (0.8 if recent else 1.0)
        reach = max(150, int(random.gauss(base, base * 0.22)))
        i += 1
        rows.append([
            f"17900{i:06d}", "17841400000000", "cafe_bloom", "Cafe Bloom", f"{random.choice(TOPICS)} ☕",
            random.randint(8, 40) if ptype == "IG reel" else "",
            day.replace(hour=random.choice([9, 13, 18, 20])).strftime("%m/%d/%Y %H:%M"),
            f"https://www.instagram.com/p/sample{i}/", ptype, "", "Lifetime",
            int(reach * random.uniform(1.4, 2.2)), reach, int(reach * 0.06), int(reach * 0.01),
            int(reach * 0.002), int(reach * 0.008), int(reach * 0.015),
        ])
    day += timedelta(days=1)

with open(sys.argv[1], "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow(HEADER)
    writer.writerows(rows)
print(f"wrote {len(rows)} posts to {sys.argv[1]}")
