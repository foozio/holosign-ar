# Specification: Mass Sharded Training

## Goal
Utilize the complete 100-sign sharded dataset to train a robust YOLOv8 model for real-time ASL recognition in the browser.

## Requirements
1. **Data Completeness**: All 100 classes from the root `sharded_data/` must be included.
2. **YOLO Format**: Sharded JSON landmarks must be converted to YOLO-compatible bounding boxes.
3. **High Vocabulary**: The model must support all 100 signs identified in `top_100_signs.json`.
4. **Performance**: The final exported model must run efficiently in the browser via TensorFlow.js.

## Success Criteria
- Successful generation of a 100-class YOLO dataset.
- Trained YOLOv8 model with satisfactory accuracy on the 100-sign vocabulary.
- Seamless integration and detection in the HoloSign AR web application.
