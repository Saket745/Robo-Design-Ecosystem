#if defined(ARDUINO) || defined(ESP32)
#include <Arduino.h>
#include <Wire.h>
#include <CAN.h>
#else
// Stubs for IDE/Linter compliance when not compiling under Arduino IDE
#include <stdint.h>
#include <stddef.h>
// Note: stdio.h not needed — SerialClass stub uses empty function bodies

#define IRAM_ATTR
#define FALLING 0
#define LOW 0
#define HIGH 1
#define INPUT 0
#define OUTPUT 1

typedef uint32_t TickType_t;
typedef void* TaskHandle_t;

#define pdMS_TO_TICKS(ms) (ms)
#define xTaskCreatePinnedToCore(task, name, stack, params, priority, handle, core)
#define vTaskDelayUntil(prev, interval)
#define xTaskGetTickCount() (0)

#define ledcWrite(channel, duty)
#define constrain(x, lo, hi) ((x)<(lo)?(lo):((x)>(hi)?(hi):(x)))
#define map(val, in_min, in_max, out_min, out_max) (0)
#define pinMode(pin, mode)
#define digitalWrite(pin, val)
#define attachInterrupt(pin, isr, mode)
#define digitalPinToInterrupt(pin) (pin)

struct TwoWire {
    void begin(int sda, int scl) {}
    void beginTransmission(int addr) {}
    void write(uint8_t val) {}
    void endTransmission(bool stop = true) {}
    void requestFrom(int addr, int len) {}
    uint8_t read() { return 0; }
} Wire;

struct CANClass {
    void setPins(int rx, int tx) {}
    bool begin(long speed) { return true; }
    int parsePacket() { return 0; }
    long packetId() { return 0; }
    bool available() { return false; }
    uint8_t read() { return 0; }
} CAN;

struct SerialClass {
    void begin(long baud) {}
    void printf(const char* format, ...) {}
    void print(const char* msg) {}
    void println(const char* msg) {}
} Serial;
#endif

// Pins allocations
#define IMU_SDA 21
#define IMU_SCL 22
#define CAN_RX 4
#define CAN_TX 5
#define ESTOP_PIN 13

// Global State
volatile bool g_estop_triggered = false;
float g_target_angles[12] = {0.0};

// Task Handlers
TaskHandle_t xSensorTaskHandle = NULL;
TaskHandle_t xControlTaskHandle = NULL;

// ISR for Emergency Stop Button
void IRAM_ATTR estop_isr() {
    g_estop_triggered = true;
    // Hard interrupt to shut down motor relays instantly
    digitalWrite(ESTOP_PIN, LOW); 
}

// Task 1: Poll IMU Sensor (BMI270) at 100Hz
void SensorTask(void * pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(10); // 10ms = 100Hz

    Wire.begin(IMU_SDA, IMU_SCL);
    // Initialize BMI270 registers
    Wire.beginTransmission(0x68);
    Wire.write(0x7D); // Power control register
    Wire.write(0x0E); // Enable Accel, Gyro, Temp
    Wire.endTransmission();

    for(;;) {
        vTaskDelayUntil(&xLastWakeTime, xFrequency);

        if (g_estop_triggered) {
            continue;
        }

        // Read 6-axis IMU raw data bytes
        Wire.beginTransmission(0x68);
        Wire.write(0x0C); // Start address of data registers
        Wire.endTransmission(false);
        Wire.requestFrom(0x68, 12);

        // FIX: Read bytes into temporaries to avoid undefined evaluation
        // order. C++ does not guarantee which operand of '|' is evaluated
        // first, so Wire.read() calls could return bytes in swapped order.
        uint8_t imu_buf[12];
        for (int b = 0; b < 12; b++) {
            imu_buf[b] = Wire.read();
        }
        int16_t ax = (int16_t)(imu_buf[0]  | (imu_buf[1]  << 8));
        int16_t ay = (int16_t)(imu_buf[2]  | (imu_buf[3]  << 8));
        int16_t az = (int16_t)(imu_buf[4]  | (imu_buf[5]  << 8));
        int16_t gx = (int16_t)(imu_buf[6]  | (imu_buf[7]  << 8));
        int16_t gy = (int16_t)(imu_buf[8]  | (imu_buf[9]  << 8));
        int16_t gz = (int16_t)(imu_buf[10] | (imu_buf[11] << 8));

        // Format and send IMU telemetry to Jetson over serial/CAN
        Serial.printf("[TELEM] IMU: %d,%d,%d,%d,%d,%d\n", ax, ay, az, gx, gy, gz);
    }
}

// Task 2: Write PWM commands to motor controllers
void ControlTask(void * pvParameters) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(20); // 20ms = 50Hz (Standard servo PWM)

    for(;;) {
        vTaskDelayUntil(&xLastWakeTime, xFrequency);

        if (g_estop_triggered) {
            // Write zero pulse to all servos (neutral/slack position)
            for (int i = 0; i < 12; i++) {
                ledcWrite(i, 0);
            }
            Serial.println("[ESTOP] Emergency shutdown active. Relays disconnected.");
            continue;
        }

        // Write servo pulses based on targets
        for (int i = 0; i < 12; i++) {
            // Map target angles in radians to PWM duty cycle counts
            float angle_deg = g_target_angles[i] * 57.2958f;
            // FIX: Clamp angle to safe servo range BEFORE mapping.
            // Without constrain(), out-of-range angles produce duty cycles
            // outside [500,2500]us which can damage servos or exceed
            // mechanical joint limits defined in robot.urdf.
            angle_deg = constrain(angle_deg, -90.0f, 90.0f);
            uint32_t duty = map((long)angle_deg, -90, 90, 500, 2500);
            ledcWrite(i, duty);
        }
    }
}

void setup() {
    Serial.begin(115200);
    
    // E-Stop Config
    pinMode(ESTOP_PIN, OUTPUT);
    digitalWrite(ESTOP_PIN, HIGH); // Enable relays
    attachInterrupt(digitalPinToInterrupt(12), estop_isr, FALLING); // Pull-down trigger

    // CAN Bus init for communicating with Jetson Orin
    CAN.setPins(CAN_RX, CAN_TX);
    if (!CAN.begin(1000E3)) { // 1Mbps speed
        Serial.println("Starting CAN failed!");
        while (1);
    }

    // Allocate FreeRTOS Tasks on separate CPU cores
    xTaskCreatePinnedToCore(SensorTask, "SensorTask", 2048, NULL, 3, &xSensorTaskHandle, 0);
    xTaskCreatePinnedToCore(ControlTask, "ControlTask", 2048, NULL, 4, &xControlTaskHandle, 1);
}

void loop() {
    // Poll CAN interface for master command messages
    int packetSize = CAN.parsePacket();
    if (packetSize) {
        long id = CAN.packetId();
        if (id == 0x100) { // Command packet ID
            for (int i = 0; i < 12 && CAN.available(); i++) {
                // FIX: Same evaluation-order bug as SensorTask.
                // Read low byte first, then high byte, deterministically.
                uint8_t lo = CAN.read();
                uint8_t hi = CAN.available() ? CAN.read() : 0;
                int16_t raw_val = (int16_t)(lo | (hi << 8));
                g_target_angles[i] = raw_val / 1000.0f; // scale from milli-rad
            }
        }
    }
}
