from roboflow import Roboflow
import os
import sys

def download_dataset(api_key, workspace, project, version):
    """
    Downloads a dataset from Roboflow in YOLOv8 format (compatible with Ultralytics).
    """
    rf = Roboflow(api_key=api_key)
    try:
        project_instance = rf.workspace(workspace).project(project)
        dataset = project_instance.version(version).download("yolov8")
        print(f"Dataset downloaded to: {dataset.location}")
        return dataset.location
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Configuration - These should ideally be environment variables or arguments
    API_KEY = os.getenv("ROBOFLOW_API_KEY")
    WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "your-workspace")
    PROJECT = os.getenv("ROBOFLOW_PROJECT", "your-project")
    VERSION = int(os.getenv("ROBOFLOW_VERSION", 1))

    if not API_KEY:
        print("Error: ROBOFLOW_API_KEY environment variable is not set.")
        sys.exit(1)

    download_dataset(API_KEY, WORKSPACE, PROJECT, VERSION)
