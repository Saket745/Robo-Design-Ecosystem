import math

class LegKinematics3DOF:
    def __init__(self, l1=0.05, l2=0.15, l3=0.15):
        """
        Initialize leg segment lengths.
        l1: Hip/coxa length (m)
        l2: Thigh/femur length (m)
        l3: Calf/tibia length (m)
        """
        self.l1 = l1
        self.l2 = l2
        self.l3 = l3
        
        # Joint limits in radians
        self.limits = {
            'hip': (-math.pi/4, math.pi/4),     # -45 to +45 deg
            'thigh': (-math.pi/3, math.pi/3),   # -60 to +60 deg
            'calf': (-math.pi/2, 0.0)           # -90 to 0 deg (always flexed back)
        }

    def forward_kinematics(self, q_hip, q_thigh, q_calf):
        """
        Compute foot tip position relative to hip mount coordinates.
        q_hip, q_thigh, q_calf: Joint angles (radians)
        Returns: (x, y, z) foot position in meters
        """
        # Symmetrical rotation computations
        r = self.l1 + self.l2 * math.cos(q_thigh) + self.l3 * math.cos(q_thigh + q_calf)
        
        x = r * math.cos(q_hip)
        y = r * math.sin(q_hip)
        z = self.l2 * math.sin(q_thigh) + self.l3 * math.sin(q_thigh + q_calf)
        
        return x, y, z

    def inverse_kinematics(self, x, y, z):
        """
        Solve joint angles for a target foot position.
        x, y, z: Target position (meters)
        Returns: (q_hip, q_thigh, q_calf) in radians
        """
        # 1. Hip Angle
        q_hip = math.atan2(y, x)
        
        # Project foot position onto the leg plane (XZ equivalent)
        r_plane = math.sqrt(x**2 + y**2) - self.l1
        
        # Distance from femur joint to foot tip
        d_sq = r_plane**2 + z**2
        d = math.sqrt(d_sq)
        
        if d > (self.l2 + self.l3) or d < abs(self.l2 - self.l3):
            raise ValueError(f"Target position ({x}, {y}, {z}) lies outside leg workspace boundary (singularity).")

        # 2. Tibia/Calf Angle (using Law of Cosines)
        cos_calf = (self.l2**2 + self.l3**2 - d_sq) / (2 * self.l2 * self.l3)
        # Numerical boundary cleaning
        cos_calf = max(-1.0, min(1.0, cos_calf))
        q_calf = -math.acos(cos_calf) # Negated for standard leg flexion

        # 3. Femur/Thigh Angle
        alpha = math.atan2(z, r_plane)
        cos_beta = (self.l2**2 + d_sq - self.l3**2) / (2 * self.l2 * d)
        cos_beta = max(-1.0, min(1.0, cos_beta))
        beta = math.acos(cos_beta)
        q_thigh = alpha + beta

        # 4. Limits Enforcer
        self._check_limits('hip', q_hip)
        self._check_limits('thigh', q_thigh)
        self._check_limits('calf', q_calf)

        return q_hip, q_thigh, q_calf

    def _check_limits(self, joint_name, angle):
        min_val, max_val = self.limits[joint_name]
        if not (min_val <= angle <= max_val):
            deg = math.degrees(angle)
            min_deg = math.degrees(min_val)
            max_deg = math.degrees(max_val)
            raise ValueError(f"Joint limit violation on {joint_name}: {deg:.2f}° lies outside [{min_deg}°, {max_deg}°]")

# Self test block
if __name__ == "__main__":
    leg = LegKinematics3DOF()
    print("--- Leg Kinematics Solver Test ---")
    
    # Target joint angles
    test_angles = (0.1, 0.2, -0.8)
    print(f"Original Joint Angles: hip={test_angles[0]:.3f}, thigh={test_angles[1]:.3f}, calf={test_angles[2]:.3f} rad")
    
    # Calculate Forward Kinematics
    x, y, z = leg.forward_kinematics(*test_angles)
    print(f"Computed Tip Coordinate: x={x:.4f}m, y={y:.4f}m, z={z:.4f}m")
    
    # Solve Inverse Kinematics
    try:
        sol = leg.inverse_kinematics(x, y, z)
        print(f"Solved Inverse Kinematics: hip={sol[0]:.3f}, thigh={sol[1]:.3f}, calf={sol[2]:.3f} rad")
        print("Success! IK matches FK.")
    except Exception as e:
        print("Failed:", str(e))
