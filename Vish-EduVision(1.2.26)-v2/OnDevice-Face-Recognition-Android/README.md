# EduVision - On-Device Face Recognition Attendance System

**EduVision** is a robust, offline-first Android application designed to automate attendance tracking in educational institutions using advanced on-device face recognition technology. Built with **Kotlin** and **Jetpack Compose**, it ensures data privacy by processing face embeddings locally.

This project is part of a larger ecosystem that includes a [Web Dashboard](file:///c:/AntiGravity/EduVision-Final/Dashboard/README.md) for centralized monitoring.

<img src="https://github.com/user-attachments/assets/3a79776c-e5dd-48c3-8b84-6ec3eaf32d2f" width="80%"/>

## Key Features

### 1. Smart Attendance Tracking
- **Real-Time Recognition**: Identifies multiple students instantly using a live camera feed.
- **Automated Marking**: Automatically marks students as "Present" upon identification.
- **Offline Capability**: Fully functional without internet; all embeddings and logs are stored locally.

### 2. Student Management
- **Easy On-Boarding**: Capture face samples directly through the app to register new students.
- **Secure Embeddings**: Stores high-dimensional mathematical representations, not raw images.

### 3. Data & Sync
- **Attendance Logs**: Comprehensive daily logs with timestamps.
- **Cloud Synchronization**: Integrated with **Supabase** to backup attendance data to a central server.

---

## Technical Architecture

The app follows **Clean Architecture** and **MVVM** principles.

### Technology Stack
- **Language**: Kotlin (100% Native)
- **UI**: Jetpack Compose (Material3)
- **ML Engine**: 
  - **Face Detection**: ML Kit / MediaPipe (Configurable)
  - **Embedding Generation**: TensorFlow Lite with **FaceNet** (128-d or 512-d)
- **Database**: **ObjectBox** (High-performance NoSQL with Vector Search capabilities)

---

## Setup & Configuration

### Prerequisites
- Android Studio Koala or newer.
- JDK 17.
- Physical Android device (recommended for Camera/ML).

### Choosing the FaceNet model
The app supports both 128 and 512-dimension FaceNet models. See [FaceNet.kt](file:///c:/AntiGravity/EduVision-Final/Vish-EduVision(1.2.26)-v2/OnDevice-Face-Recognition-Android/app/src/main/java/com/ml/shubham0204/facenet_android/domain/embeddings/FaceNet.kt) to toggle between them.

### Face Detection Engine
Switch between **ML Kit** and **MediaPipe** in [AppModule.kt](file:///c:/AntiGravity/EduVision-Final/Vish-EduVision(1.2.26)-v2/OnDevice-Face-Recognition-Android/app/src/main/java/com/ml/shubham0204/facenet_android/di/AppModule.kt).

---

## How It Works

1. **Detection**: ML Kit/MediaPipe identifies faces in the frame.
2. **Preprocessing**: Normalizes and crops the face image.
3. **Embedding**: FaceNet converts the image into a numerical vector (embedding).
4. **Vector Search**: ObjectBox performs a nearest-neighbor search against the local database.
5. **Recognition**: If the similarity exceeds the threshold, the student is recognized and marked present.

---

## Future Roadmap
- Enhanced PDF reporting.
- Multi-camera kiosk support.
- Advanced remote management via the web dashboard.
