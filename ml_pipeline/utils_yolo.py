def convert_to_yolo_format(landmarks, label_id):
    """
    Converts MediaPipe landmarks to YOLO bounding box format (x_center, y_center, width, height)
    normalized by image dimensions.
    """
    if not landmarks:
        return None
        
    x_coords = [lm['x'] for lm in landmarks]
    y_coords = [lm['y'] for lm in landmarks]
    
    xmin, xmax = min(x_coords), max(x_coords)
    ymin, ymax = min(y_coords), max(y_coords)
    
    # Add some padding
    padding = 0.05
    xmin = max(0, xmin - padding)
    xmax = min(1, xmax + padding)
    ymin = max(0, ymin - padding)
    ymax = min(1, ymax + padding)
    
    width = xmax - xmin
    height = ymax - ymin
    x_center = xmin + width / 2
    y_center = ymin + height / 2
    
    return f"{label_id} {x_center} {y_center} {width} {height}"
