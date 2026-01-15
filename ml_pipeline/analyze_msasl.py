import json
import os
import argparse

def filter_and_rank_signs(samples, exclude_list, top_n=100):
    counts = {}
    for s in samples:
        label = s['clean_text']
        counts[label] = counts.get(label, 0) + 1
    
    # Sort by frequency descending
    sorted_signs = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    # Filter
    filtered = [s for s in sorted_signs if s[0].lower() not in [e.lower() for e in exclude_list]]
    
    return filtered[:top_n]

def main():
    parser = argparse.ArgumentParser(description='Analyze MS-ASL for top signs')
    parser.add_argument('--limit', type=int, default=100, help='Number of signs to return')
    args = parser.parse_args()

    # Configuration
    MSASL_TRAIN_PATH = os.path.join(os.path.dirname(__file__), 'MS-ASL', 'MSASL_train.json')
    EXCLUDE_LIST = ["Hello", "A", "B", "C", "D", "E", "1", "2", "3"]
    OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'top_100_signs.json')

    if not os.path.exists(MSASL_TRAIN_PATH):
        print(f"MSASL training data not found at {MSASL_TRAIN_PATH}")
        return

    print(f"Loading {MSASL_TRAIN_PATH}...")
    with open(MSASL_TRAIN_PATH, 'r') as f:
        data = json.load(f)

    print(f"Analyzing {len(data)} samples...")
    top_signs = filter_and_rank_signs(data, EXCLUDE_LIST, top_n=args.limit)

    print(f"\nTop {args.limit} signs (excluding {EXCLUDE_LIST}):")
    for i, (sign, count) in enumerate(top_signs):
        print(f"{i+1}. {sign}: {count} samples")

    # Save to file
    signs_only = [s[0] for s in top_signs]
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(signs_only, f, indent=2)
    
    print(f"\nSaved sign list to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
