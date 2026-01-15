import unittest
import json
import os
import sys

# Add parent dir to path to import utils_yolo
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils_yolo import convert_to_yolo_format

class TestYoloDataConversion(unittest.TestCase):
    def test_basic_conversion(self):
        # Mock landmarks
        landmarks = [
            {'x': 0.5, 'y': 0.5, 'z': 0},
            {'x': 0.6, 'y': 0.6, 'z': 0},
        ]
        label_id = 0
        result = convert_to_yolo_format(landmarks, label_id)
        
        # Expected: xmin=0.45, xmax=0.65, ymin=0.45, ymax=0.65
        # width=0.2, height=0.2, x_center=0.55, y_center=0.55
        expected = "0 0.55 0.55 0.2 0.2"
        self.assertEqual(result, expected)

    def test_boundary_conditions(self):
        landmarks = [{'x': 0, 'y': 0, 'z': 0}]
        result = convert_to_yolo_format(landmarks, 1)
        # x_center=0.025 (clamped), width=0.05
        # Actually with my padding logic: xmin=-0.05 -> 0, xmax=0.05 -> 0.05
        # x_center=0.025, width=0.05
        self.assertTrue(result.startswith("1 0.025 0.025 0.05 0.05"))

if __name__ == '__main__':
    unittest.main()
