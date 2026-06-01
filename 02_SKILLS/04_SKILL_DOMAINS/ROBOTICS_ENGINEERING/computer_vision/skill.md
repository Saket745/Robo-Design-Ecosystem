# Skill: Computer Vision

## Purpose
Extract depth mappings, detect obstacles, and recognize interactive items.

## Inputs
- RGB-D depth camera stream
- Camera intrinsic/extrinsic calibration data

## Outputs
- Depth point cloud arrays
- Bounding boxes of detected items

## Required Tools
- OpenCV
- Open3D
- TensorRT
- YOLOv8

## Workflow
1. Configure camera exposure, resolution, and frame rates.
2. Calibrate camera lens distortion parameters.
3. Process color frames through optimized neural networks (YOLO).
4. Filter point clouds to extract ground plane and obstacles.
5. Publish object locations relative to the camera frame.

## Constraints
- Inference frame rate must maintain >= 15 FPS.
- Memory consumption must fit within Jetson Orin RAM limits.

## Validation
- Calculate Mean Average Precision (mAP) on calibration test set.
- Verify object depth measurement accuracy within 5cm tolerance.

## Failure Conditions
- Pipeline lag and frame drop under heavy processing loads.
- False obstacle detection due to lens reflections.

## Dependencies
- sensor_fusion

## Deliverables
- detection_node.py
- camera_calibration.yaml
