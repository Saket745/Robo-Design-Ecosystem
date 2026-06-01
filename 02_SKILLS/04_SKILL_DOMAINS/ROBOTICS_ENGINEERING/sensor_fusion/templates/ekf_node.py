#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu
from nav_msgs.msg import Odometry
from geometry_msgs.msg import PoseStamped, TransformStamped
import tf2_ros
import numpy as np

class RobotEKFPoseEstimator(Node):
    def __init__(self):
        super().__init__('robot_ekf_pose_estimator')
        
        # ROS2 Subscriptions
        self.create_subscription(Imu, '/imu/data_raw', self.imu_callback, 10)
        self.create_subscription(Odometry, '/odom/raw', self.odom_callback, 10)
        
        # ROS2 Publishers
        self.pose_pub = self.create_publisher(PoseStamped, '/ekf/pose', 10)
        self.tf_broadcaster = tf2_ros.TransformBroadcaster(self)
        
        # EKF State Matrix definition: State vector x = [x, y, vx, vy, yaw]
        self.state = np.zeros(5)
        self.covariance = np.eye(5) * 0.1
        self.Q = np.eye(5) * 0.01  # Process noise covariance
        self.R_odom = np.eye(3) * 0.05 # Odometry measurement noise
        
        self.last_time = self.get_clock().now()
        self.get_logger().info("EKF Pose Estimator initialized. Ready for sensor feeds.")

    def imu_callback(self, msg: Imu):
        """
        State propagation step using high-frequency IMU readings.
        """
        current_time = self.get_clock().now()
        dt = (current_time - self.last_time).nanoseconds / 1e9
        self.last_time = current_time
        
        if dt <= 0.0:
            return

        # Acceleration and angular rate inputs
        ax = msg.linear_acceleration.x
        ay = msg.linear_acceleration.y
        omega_z = msg.angular_velocity.z
        
        # Propagate state variables (Euler Integration)
        yaw = self.state[4]
        vx = self.state[2]
        vy = self.state[3]
        
        # Convert local body accelerations to global world coordinates
        ax_global = ax * np.cos(yaw) - ay * np.sin(yaw)
        ay_global = ax * np.sin(yaw) + ay * np.cos(yaw)
        
        # Update velocities and positions
        self.state[0] += vx * dt + 0.5 * ax_global * dt**2
        self.state[1] += vy * dt + 0.5 * ay_global * dt**2
        self.state[2] += ax_global * dt
        self.state[3] += ay_global * dt
        self.state[4] += omega_z * dt
        
        # Propagate Process Covariance (P = F * P * F^T + Q)
        F = np.eye(5)
        F[0, 2] = dt
        F[1, 3] = dt
        # Simplified yaw dynamics linearization
        F[0, 4] = -vx * dt * np.sin(yaw) - vy * dt * np.cos(yaw)
        F[1, 4] = vx * dt * np.cos(yaw) - vy * dt * np.sin(yaw)
        
        self.covariance = F @ self.covariance @ F.T + self.Q
        self.publish_current_state()

    def odom_callback(self, msg: Odometry):
        """
        State correction/measurement step using low-frequency wheel/joint odometry.
        Measurements: [x_meas, y_meas, yaw_meas]
        """
        x_meas = msg.pose.pose.position.x
        y_meas = msg.pose.pose.position.y
        
        # Simple Euler yaw extraction from quaternion (Z axis)
        qz = msg.pose.pose.orientation.z
        qw = msg.pose.pose.orientation.w
        yaw_meas = 2.0 * np.arctan2(qz, qw)
        
        # Measurement vector z
        z = np.array([x_meas, y_meas, yaw_meas])
        
        # Measurement matrix H
        H = np.zeros((3, 5))
        H[0, 0] = 1.0 # x mapping
        H[1, 1] = 1.0 # y mapping
        H[2, 4] = 1.0 # yaw mapping
        
        # Kalman Gain computation (K = P * H^T * (H * P * H^T + R)^-1)
        S = H @ self.covariance @ H.T + self.R_odom
        K = self.covariance @ H.T @ np.linalg.inv(S)
        
        # Innovation y
        y = z - H @ self.state
        
        # Wrap yaw innovation difference between -pi and +pi
        y[2] = (y[2] + np.pi) % (2.0 * np.pi) - np.pi
        
        # Correct state and covariance estimates
        self.state = self.state + K @ y
        self.covariance = (np.eye(5) - K @ H) @ self.covariance

    def publish_current_state(self):
        # Create and publish PoseStamped msg
        pose_msg = PoseStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = 'odom'
        pose_msg.pose.position.x = self.state[0]
        pose_msg.pose.position.y = self.state[1]
        
        # Convert yaw to quaternion
        yaw = self.state[4]
        pose_msg.pose.orientation.z = np.sin(yaw / 2.0)
        pose_msg.pose.orientation.w = np.cos(yaw / 2.0)
        
        self.pose_pub.publish(pose_msg)
        
        # Broadcast coordinate transformation (TF)
        t = TransformStamped()
        t.header.stamp = pose_msg.header.stamp
        t.header.frame_id = 'odom'
        t.child_frame_id = 'base_link'
        t.transform.translation.x = pose_msg.pose.position.x
        t.transform.translation.y = pose_msg.pose.position.y
        t.transform.rotation.z = pose_msg.pose.orientation.z
        t.transform.rotation.w = pose_msg.pose.orientation.w
        self.tf_broadcaster.sendTransform(t)

def main(args=None):
    rclpy.init(args=args)
    node = RobotEKFPoseEstimator()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    rclpy.shutdown()

if __name__ == '__main__':
    main()
