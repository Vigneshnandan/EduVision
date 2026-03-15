# EduVision - On-Device Face Recognition Attendance System

## Project Overview
**EduVision** is a robust, offline-first Android application designed to automate attendance tracking in educational institutions using advanced face recognition technology. Built with **Kotlin** and **Jetpack Compose**, it leverages on-device Machine Learning (ML) to ensure data privacy, speed, and reliability without requiring a continuous internet connection.

## Key Features

### 1. Smart Attendance Tracking
-   **Real-Time Recognition**: Identifies multiple students accurately and instantly using live camera feed.
-   **Automated Marking**: Automatically marks students as "Present" upon successful identification.
-   **Offline Capability**: Fully functional without internet access. All face embeddings and attendance records are stored locally.

### 2. Student Management
-   **Registration**: Easy On-Boarding of new students by capturing face samples directly through the app.
-   **Profile Details**: Stores essential information such as Name, Class, and Roll Number.
-   **Face Embeddings**: Generates and stores secure mathematical representations (embeddings) of faces, not raw images, ensuring privacy.

### 3. Data & Reports
-   **Attendance Logs**: Comprehensive daily logs showing time-stamped entries for every recognized student.
-   **Search & History**: Capability to review past attendance records.
-   **Cloud Synchronization** (Optional): Architecture supports syncing logic to backup attendance data to a central cloud server (e.g., Supabase/PostgreSQL).

### 4. Advanced Security & Accuracy
-   **Liveness Detection**: Integrated anti-spoofing measures to prevent fraud using photos or videos.
-   **High Accuracy**: Utilizes **FaceNet** models (state-of-the-art deep learning model) for precise face matching.
-   **Configurable Precision**: Adjustable thresholds and model selection (FaceNet 128 vs 512 dimensions) to balance between speed and accuracy.

## Technical Architecture

The application follows **Clean Architecture** principles coupled with the **MVVM (Model-View-ViewModel)** design pattern, ensuring modularity, scalability, and ease of testing.

### Technology Stack
-   **Language**: [Kotlin](https://kotlinlang.org/) (100% Native)
-   **UI Framework**: [Jetpack Compose](https://developer.android.com/jetpack/compose) (Modern, declarative UI toolkit) based on Material3 Design.
-   **Dependency Injection**: [Koin](https://insert-koin.io/) (Lightweight, pragmatic DI framework for Kotlin)
-   **Database**: [ObjectBox](https://objectbox.io/)
    -   High-performance NoSQL database for structured data.
    -   **Vector Database** capabilities for storing and searching face embeddings (HNSW Indexing).

### Machine Learning Pipeline
1.  **Face Detection**: [ML Kit](https://developers.google.com/ml-kit) or [MediaPipe](https://developers.google.com/mediapipe) (Configurable) detects faces in the camera frame.
2.  **Preprocessing**: Crops and normalizes the face image (160x160 px).
3.  **Embedding Generation**: [TensorFlow Lite](https://www.tensorflow.org/lite) runs the **FaceNet** model to convert the image into a 128-d or 512-d floating-point vector.
4.  **Vector Search**: **ObjectBox** performs a nearest-neighbor search to find the closest matching registered face in the database.
5.  **Verification**: Cosine similarity is calculated; if it exceeds a defined threshold, the face is recognized.

## Project Structure

```
app/src/main/java/com/ml/shubham0204/facenet_android/
├── data/               # Data Layer: Database entities, Repositories, API sources
│   ├── cloud/          # Cloud sync logic (Retrofit/API services)
│   └── DataModels.kt   # Core entities (PersonRecord, FaceImageRecord, AttendanceRecord)
├── di/                 # Dependency Injection modules (Koin)
├── domain/             # Domain Layer: Use cases, Business logic independent of UI
│   ├── embeddings/     # FaceNet implementation
│   └── face_detection/ # ML Kit / MediaPipe wrappers
├── presentation/       # UI Layer: Composables, ViewModels
│   ├── components/     # Reusable UI elements
│   ├── screens/        # Feature screens
│   │   ├── add_face/       # Student Registration
│   │   ├── detect_screen/  # Main Attendance Taking Screen
│   │   ├── face_list/      # Registered Students List
│   │   └── log/            # Attendance History/Logs
│   └── theme/          # App styling and theming
```

## Setup & Installation

1.  **Prerequisites**:
    -   Android Studio Koala or newer.
    -   JDK 17.
    -   Physical Android device (Emulator support is limited for Camera/ML).

2.  **Build Steps**:
    -   Clone the repository.
    -   Sync Gradle files.
    -   Run the `app` configuration on a connected Android device.

3.  **Configuration**:
    -   Select face detection engine (ML Kit vs MediaPipe) in `AppModule.kt`.
    -   Choose FaceNet model model (Quantized/Float, 128/512) in `FaceNet.kt`.

## Future Roadmap
-   **Enhanced Reporting**: Monthly/Weekly PDF report generation.
-   **Multi-Camera Support**: optimization for tablet/kiosk usage.
-   **Remote Management**: Web dashboard for headmasters to view synced data.
