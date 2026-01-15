# Implementation Plan: Mass Sharded Training

## Phase 1: Dataset Consolidation [x]
- [x] Task: Consolidate all 100 classes into `ml_pipeline/sharded_data/`. (b0ecc26)
- [x] Task: Create `ml_pipeline/prepare_mass_yolo.py` to generate the full YOLO dataset from shards. (b0ecc26)
- [x] Task: Conductor - User Manual Verification 'Dataset Consolidation' (Protocol in workflow.md) (b0ecc26)

## Phase 2: Mass Training [ ]
- [ ] Task: Run `train_yolo.py` with the 100-class dataset.
- [ ] Task: Verify the trained model performance and save `best.pt`.
- [ ] Task: Conductor - User Manual Verification 'Mass Training'

## Phase 3: Model Export [ ]
- [ ] Task: Export the trained model to TensorFlow.js format.
- [ ] Task: Update `public/models/yolo_model/classes.json` with the full 100 signs.
- [ ] Task: Conductor - User Manual Verification 'Model Export'

## Phase 4: Integration [ ]
- [ ] Task: Integrate the new 100-class model into the web app.
- [ ] Task: Final end-to-end verification of detection for multiple signs.
- [ ] Task: Conductor - User Manual Verification 'Integration'
