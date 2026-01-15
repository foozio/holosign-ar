import unittest
import os
import shutil
import json

def get_shard_path(base_dir, label):
    """
    Logic to be implemented: create a path like sharded_data/apple/data.json
    """
    # Sanitize label for filesystem
    safe_label = "".join([c for c in label if c.isalnum() or c in (' ', '_')]).strip().replace(' ', '_')
    shard_dir = os.path.join(base_dir, safe_label)
    return shard_dir

class TestShardedStorage(unittest.TestCase):
    def setUp(self):
        self.test_dir = 'test_sharded_data'
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        os.makedirs(self.test_dir)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_shard_directory_creation(self):
        label = "thank you"
        shard_dir = get_shard_path(self.test_dir, label)
        
        os.makedirs(shard_dir, exist_ok=True)
        self.assertTrue(os.path.exists(shard_dir))
        self.assertTrue(shard_dir.endswith("thank_you"))

    def test_sharded_file_writing(self):
        label = "apple"
        shard_dir = get_shard_path(self.test_dir, label)
        os.makedirs(shard_dir, exist_ok=True)
        
        file_path = os.path.join(shard_dir, "samples.json")
        data = {"label": "apple", "samples": [1, 2, 3]}
        
        with open(file_path, 'w') as f:
            json.dump(data, f)
            
        self.assertTrue(os.path.exists(file_path))
        with open(file_path, 'r') as f:
            loaded = json.load(f)
        self.assertEqual(loaded['label'], "apple")

if __name__ == '__main__':
    unittest.main()
