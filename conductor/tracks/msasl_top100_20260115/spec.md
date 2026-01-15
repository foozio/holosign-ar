# Specification: MS-ASL Top 100 Integration

## Overview
This track focuses on expanding the application's vocabulary by processing and integrating the top 100 most frequent signs from the MS-ASL dataset, excluding those already implemented (Hello, A, B, C, D, E, 1, 2, 3).

## Functional Requirements
- **Frequency Analysis**: Identify the top 100 most frequent signs in the MS-ASL training set.
- **Filtering**: Exclude existing signs: "Hello", "A", "B", "C", "D", "E", "1", "2", "3".
- **Mass Processing**: Automate the download and landmark/YOLO feature extraction for these 100 signs.
- **Sharded Storage**: Organize processed features into separate files/directories sharded by class name for scalability.
- **Robustness**: Implement a "skip-on-failure" policy for missing videos or empty detections to ensure the pipeline completes.

## Non-Functional Requirements
- **Disk Efficiency**: Manage temporary video files effectively during processing.
- **Data Integrity**: Ensure sharded files are consistently formatted for the existing `train_dynamic.py` and `train_yolo.py` scripts.

## Acceptance Criteria
- A dataset containing features for 100 new ASL signs is generated.
- Data is sharded by class in the `ml_pipeline/sharded_data/` directory.
- The pipeline completes without manual intervention, skipping dead links.

## Out of Scope
- Training the final model (this track covers data preparation only).
- Improving the detection accuracy of the MediaPipe landmarker itself.
