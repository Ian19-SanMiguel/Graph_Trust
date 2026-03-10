import os
import joblib
import csv
from sklearn.tree import export_text

FEATURE_NAMES = [
    "total_connections",
    "identity_connections",
    "shared_identity_count",
    "unique_counterparties",
    "low_rating_ratio",
    "report_signal_count",
]

ROOT_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT_DIR, "graphtrust_model.pkl")
OUT_DIR = os.path.join(ROOT_DIR, "model_viz")


def main():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")

    os.makedirs(OUT_DIR, exist_ok=True)

    model = joblib.load(MODEL_PATH)

    importances = model.feature_importances_
    print("Feature importances:")
    for name, value in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True):
        print(f"- {name}: {value:.6f}")

    importance_csv_path = os.path.join(OUT_DIR, "feature_importances.csv")
    with open(importance_csv_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["feature", "importance"])
        for name, value in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True):
            writer.writerow([name, f"{value:.6f}"])

    tree_text_path = os.path.join(OUT_DIR, "first_tree_depth4.txt")
    tree_rules = export_text(model.estimators_[0], feature_names=FEATURE_NAMES, max_depth=4)
    with open(tree_text_path, "w", encoding="utf-8") as textfile:
        textfile.write("Random Forest first tree rules (max depth 4)\n")
        textfile.write("=" * 60 + "\n")
        textfile.write(tree_rules)

    print("\nSaved visualizations:")
    print(f"- {importance_csv_path}")
    print(f"- {tree_text_path}")


if __name__ == "__main__":
    main()
