import unittest
import json
import os
import sys

# Add parent dir to path to import analyze_msasl
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def filter_and_rank_signs(samples, exclude_list, top_n=100):
    """
    Logic to be implemented in analyze_msasl.py
    """
    counts = {}
    for s in samples:
        label = s['clean_text']
        counts[label] = counts.get(label, 0) + 1
    
    # Sort by frequency descending
    sorted_signs = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    # Filter
    filtered = [s for s in sorted_signs if s[0].lower() not in [e.lower() for e in exclude_list]]
    
    return filtered[:top_n]

class TestAnalyzeMSASL(unittest.TestCase):
    def test_frequency_counting(self):
        samples = [
            {'clean_text': 'apple'},
            {'clean_text': 'apple'},
            {'clean_text': 'banana'},
            {'clean_text': 'orange'},
            {'clean_text': 'banana'},
            {'clean_text': 'apple'},
        ]
        exclude = []
        result = filter_and_rank_signs(samples, exclude, top_n=2)
        
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0][0], 'apple')
        self.assertEqual(result[0][1], 3)
        self.assertEqual(result[1][0], 'banana')
        self.assertEqual(result[1][1], 2)

    def test_filtering(self):
        samples = [
            {'clean_text': 'hello'},
            {'clean_text': 'a'},
            {'clean_text': 'apple'},
            {'clean_text': '1'},
        ]
        exclude = ['hello', 'a', '1']
        result = filter_and_rank_signs(samples, exclude, top_n=10)
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0][0], 'apple')

if __name__ == '__main__':
    unittest.main()
