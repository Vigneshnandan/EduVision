# EduVision — Commercial License & IP Reference

## Purpose

This document summarizes the license/IP audit findings for the current EduVision repository and the practical steps required to prepare EduVision for commercial startup use.

> **Important:** This is an engineering/business due-diligence reference, not legal advice. Before commercial launch, especially where student/biometric data is involved, obtain appropriate legal review.

---

# 1. Executive Summary

The audit concludes that **EduVision can be commercially distributed, with conditions**.

No license identified in the audit prohibits commercial use. The main issues are:

- Open-source attribution and license compliance
- Correct documentation of third-party components
- Verification of AI model provenance
- Cleanup of inherited upstream project identity
- Clear separation between EduVision's original IP and third-party IP
- A complete transitive dependency license scan before commercial release

The important point is:

> **EduVision does not need to be abandoned or completely rewritten just because part of its Android recognition stack originated from an Apache-2.0 open-source project.**

The correct approach is to preserve applicable third-party licenses/attribution while clearly documenting and protecting the original EduVision work.

---

# 2. What EduVision Can Claim as Its Own

The audit identifies the following as original EduVision work, subject to normal proof of authorship and ownership:

- Attendance domain logic
- Cloud synchronization layer
- Supabase integration
- Settings/connectivity logic
- Dashboard application
- EduVision-specific UI/UX
- Product workflow connecting recognition → attendance → synchronization → dashboard
- Release/deployment configuration
- Product-specific threshold/model-selection decisions
- Application-specific business logic
- EduVision product workflow and school/teacher-facing features

These areas can form part of the startup's proprietary IP.

However, the underlying Android recognition scaffold is not exclusively EduVision IP.

---

# 3. Shubham Panchal / FaceNet-Android Origin

The Android application contains substantial code derived from:

`shubham0204/OnDevice-Face-Recognition-Android`

The audit identifies several files/components as modified derivatives of this upstream project.

Examples include:

- Android module scaffold
- `MainActivity.kt`
- `MainApplication.kt`
- `di/AppModule.kt`
- Compose/theme base
- `domain/embeddings/FaceNet.kt`
- `domain/face_detection/FaceSpoofDetector.kt`
- `MediapipeFaceDetector.kt`
- `MLKitFaceDetector.kt`
- `BaseFaceDetector.kt`
- `ObjectBoxStore.kt`
- `PersonDB.kt`
- `ImagesVectorDB.kt`
- parts of the Compose screen architecture

The upstream project is identified as Apache-2.0 licensed.

### Important

Apache 2.0 permits commercial use, modification, and redistribution.

Therefore:

- You can build a commercial startup/product around the code.
- You can modify the code.
- You can distribute the resulting application.
- You can keep your genuinely original EduVision code proprietary.

But:

- You cannot claim Shubham's original code as entirely your own.
- You should not delete required copyright/license notices.
- Applicable Apache-2.0 obligations must continue to be satisfied.
- Modified derivative files should be appropriately identified where required.
- Third-party attribution/license information should be retained in the distributed product.

---

# 4. The Correct Goal

Do **not** make the goal:

> "Remove Shubham's license."

Make the goal:

> **"Make EduVision a properly attributed, commercially compliant product with a clearly documented boundary between EduVision IP and third-party IP."**

This is the cleaner approach for:

- Startup incorporation
- Investors
- School customers
- Commercial distribution
- Technical due diligence
- Future acquisition/due diligence

---

# 5. Third-Party Technology Stack

The audit identified the following major third-party components.

| Component | License / Status | Commercial Status |
|---|---|---|
| Shubham's FaceNet-Android code | Apache 2.0 | Commercially usable with obligations |
| MiniFASNet | Apache 2.0 | Commercially usable |
| DeepFace-related code | MIT | Commercially usable |
| MediaPipe | Apache 2.0 framework | Commercial use; model terms should be verified |
| AndroidX / Jetpack Compose | Apache 2.0 | Commercially usable |
| ObjectBox | Apache 2.0 | Commercially usable |
| Koin | Apache 2.0 | Commercially usable |
| TensorFlow Lite / LiteRT | Apache 2.0 | Commercially usable |
| CameraX | Apache 2.0 | Commercially usable |
| Retrofit / Gson / Coil | Apache 2.0 | Commercially usable |
| Dashboard dependencies | Mostly MIT / ISC | Commercially usable with attribution obligations |
| Google ML Kit | Google API / ML Kit terms | Must comply with Google's applicable terms |

The audit found no direct GPL/LGPL/AGPL dependency in its manifest-level review.

A complete transitive dependency scan is still recommended before commercial release.

---

# 6. AI Model / Weight Audit

This is one of the most important parts of commercialization.

## 6.1 FaceNet Models

Relevant files:

- `facenet.tflite`
- `facenet_512.tflite`

The audit associates these with the DeepFace/model lineage, but the deeper training-data/model provenance is not completely verified.

### Status

**VERIFY MANUALLY**

The important distinction is:

> The license of the code used to load a model is not automatically the license of the model weights.

Therefore, before commercial release, verify:

- Exact source of the `.tflite` files
- Original model repository
- Model/checkpoint provenance
- Training-data lineage
- Model-specific license
- Commercial-use rights
- Redistribution rights
- Any dataset-level restrictions

---

# 7. MiniFASNet / Anti-Spoofing

Relevant files:

- `spoof_model_scale_2_7.tflite`
- `spoof_model_scale_4_0.tflite`

The audit identifies these as originating from:

**Silent-Face-Anti-Spoofing / MiniVision**

and as format-converted using tooling involving DeepFace and AI Edge Torch.

The audit identifies the relevant MiniFASNet licensing as Apache 2.0.

The existing in-code attribution should be preserved.

### Important correction

Anti-spoofing/liveness detection should **not** be claimed as an EduVision-original security model.

The upstream project already provided MiniFASNet-based anti-spoofing capability.

EduVision can claim its application-specific integration/workflow, but not ownership of the upstream model itself.

---

# 8. MediaPipe / BlazeFace

Relevant model:

`blaze_face_short_range.tflite`

The audit associates this with Google MediaPipe.

The MediaPipe framework is Apache 2.0, but the audit says the exact model-asset terms should be verified.

### Action

Verify the exact model asset's current licensing/redistribution terms before final commercial release.

---

# 9. Google ML Kit

Google ML Kit Face Detection is consumed as a dependency rather than as copied source.

The audit treats ML Kit as subject to Google's applicable API/ML Kit terms rather than simply classifying it as Apache-2.0 source code.

### Action

Review the current Google ML Kit terms applicable to the exact SDK/version being shipped.

Pay particular attention to:

- Commercial use
- Data processing
- Privacy disclosures
- Distribution requirements
- Any service-specific terms

---

# 10. EduVision Original IP vs Third-Party IP

A useful way to understand the project is:

```text
                         EDUVISION
                             |
              +--------------+--------------+
              |                             |
        YOUR ORIGINAL IP              THIRD-PARTY IP
              |                             |
       Attendance logic               FaceNet-Android
       Supabase sync                   FaceNet weights
       Dashboard                       MiniFASNet
       EduVision UI                    MediaPipe
       Business logic                  ML Kit
       Product workflow                AndroidX etc.
```

Your startup can own/protect the original EduVision portions.

The third-party components remain subject to their respective licenses.

---

# 11. Current Commercialization Status

## Can EduVision be commercially distributed?

**YES WITH CONDITIONS**

The audit found no license that currently blocks commercial distribution.

The conditions are primarily compliance and provenance cleanup:

- Complete attribution
- Add license/NOTICE documentation
- Verify model provenance
- Verify model asset terms
- Clean up upstream project identity
- Perform complete dependency scanning
- Maintain third-party license compliance

---

# 12. Can EduVision Keep Its Own Code Proprietary?

**Yes.**

The audit identifies original EduVision code such as:

- Attendance logic
- Cloud sync
- Supabase integration
- Dashboard
- Product-specific UI/UX
- Application/business logic

as original work.

However, inherited Apache-2.0 code remains subject to Apache-2.0 terms.

Apache-2.0 allows those components to be combined into a larger proprietary product.

---

# 13. Can EduVision Be Sold as SaaS / Subscription Software?

**Yes, subject to the applicable third-party terms.**

Apache-2.0 and MIT do not prevent:

- Subscription pricing
- Commercial licensing
- Paid school deployments
- SaaS delivery
- Commercial Android applications

The exact terms of proprietary/API dependencies such as Google ML Kit must still be respected.

---

# 14. Can EduVision Be Distributed as an APK/AAB?

**Yes, subject to license compliance.**

The compiled Android application can contain third-party components provided the relevant redistribution/license requirements are satisfied.

For Apache-2.0 components, the final distribution should preserve the applicable license/attribution information.

A practical approach is to include an:

**Open Source Licenses / Third-Party Licenses**

screen inside the application and retain the corresponding files in the repository/release package.

---

# 15. Investor / Startup Due-Diligence Considerations

An investor or acquirer may check:

1. Whether the company has a clean IP chain of title
2. Whether third-party licenses permit the product's use
3. Whether required attribution is present
4. Whether model weights have a defensible commercial provenance
5. Whether copyleft licenses are present
6. Which code is actually original to the company
7. Whether founders/contributors have assigned relevant IP to the company
8. Whether third-party datasets/models have appropriate rights
9. Whether privacy/biometric obligations are addressed

The current audit found no direct GPL/AGPL exposure and no license identified that blocks commercialization.

The remaining issues are primarily fixable compliance and verification tasks.

---

# 16. Files to Add

The audit recommends creating:

```text
/NOTICE
/THIRD_PARTY_LICENSES
/MODEL_LICENSES
```

These should be based on the actual third-party components in the repository.

Do not blindly copy generic license lists.

---

# 17. NOTICE

The NOTICE file should identify applicable upstream projects and attribution information.

It should include only actual third-party components found in the repository.

Potential categories include:

- FaceNet-Android
- FaceNet/model source
- MiniFASNet / Silent-Face-Anti-Spoofing
- DeepFace
- MediaPipe
- other applicable third-party components

The exact final text should be generated after verifying the upstream repositories and current licenses.

---

# 18. THIRD_PARTY_LICENSES

This file should contain a structured list of software dependencies.

Recommended format:

```text
Component:
Version:
Source:
Copyright:
License:
Commercial Use:
Attribution Required:
Notes:
```

Example:

```text
Component: OnDevice-Face-Recognition-Android
Source: shubham0204/OnDevice-Face-Recognition-Android
License: Apache License 2.0
Usage: Modified derivative
Commercial use: Permitted subject to Apache 2.0 obligations
```

Repeat for the actual third-party components used by EduVision.

---

# 19. MODEL_LICENSES

This file should document every model.

Recommended format:

```text
Model:
Filename:
Architecture:
Original Source:
Model Owner:
License:
Commercial Use:
Redistribution:
Modification/Conversion:
Attribution:
Provenance Status:
Notes:
```

For uncertain models, explicitly write:

`VERIFY MANUALLY`

rather than guessing.

---

# 20. FaceNet.kt Attribution Issue

The audit found an incomplete attribution comment in:

```text
domain/embeddings/FaceNet.kt
```

The current comment is essentially:

```kotlin
// Derived from the original project:
```

This should be completed with the appropriate upstream attribution/reference.

### Priority

**P0 — fix before commercial release**

---

# 21. Upstream Identity Cleanup

The repository still contains upstream project identity/references such as:

```text
FaceNet-Android
com.ml.shubham0204.facenet_android
shubham0204
```

There are also inherited files/references such as:

- CHANGELOG
- FUNDING configuration
- release workflow references
- original package names

### Recommended action

Replace/remove upstream *product identity* where appropriate.

For example:

```text
Old:
com.ml.shubham0204.facenet_android

New:
your EduVision package namespace
```

But:

> **Do not remove copyright/license information simply because the product has been rebranded.**

Rebranding and attribution are separate issues.

---

# 22. Copyright for EduVision Code

The audit recommends adding standard copyright headers to genuinely original files.

Examples:

```text
domain/AttendanceUseCase.kt
data/cloud/CloudSyncRepository.kt
data/cloud/CloudSyncService.kt
data/cloud/CloudSyncModels.kt
data/ConnectivityChecker.kt
data/SettingsStore.kt
Dashboard/*
```

Example format:

```text
Copyright © 2026 EduVision
All rights reserved.
```

The exact ownership entity/name should match the actual company/legal entity once incorporated.

### Important

A copyright header does not create copyright from nothing.

Original copyright generally exists automatically when an eligible original work is created.

The header primarily makes ownership clearer during due diligence.

---

# 23. What EduVision Should NOT Claim

Do not claim:

- The entire face-recognition engine was developed from scratch by EduVision
- FaceNet is an EduVision-owned model
- MiniFASNet is an EduVision-owned model
- The upstream FaceNet-Android integration was entirely written by EduVision
- Third-party model weights are proprietary EduVision assets
- Third-party code is EduVision-original code
- Removing an attribution notice transfers copyright ownership
- The anti-spoofing model itself was invented/trained by EduVision

---

# 24. What EduVision CAN Claim

Subject to ownership documentation, EduVision can describe its original contribution as including:

- AI attendance workflow
- Teacher-facing attendance experience
- Student enrollment workflow
- Student management
- Attendance records/logging
- Offline-first attendance workflow
- Supabase synchronization
- Cloud attendance management
- Dashboard
- Reporting
- EduVision-specific UI/UX
- Product architecture connecting recognition to attendance
- Application-specific business logic
- School/classroom management functionality
- Product-specific configuration and deployment work

---

# 25. Recommended Remediation Plan

## P0 — Must Fix Before Commercial Release

### P0.1 — Add license documentation

Create:

```text
NOTICE
THIRD_PARTY_LICENSES
MODEL_LICENSES
```

### P0.2 — Fix FaceNet.kt attribution

Complete the upstream attribution.

### P0.3 — Verify FaceNet model provenance

Verify:

- exact weight source
- original repository
- model license
- training-data lineage
- commercial use
- redistribution rights

### P0.4 — Verify MediaPipe model asset terms

Confirm the exact terms applicable to:

```text
blaze_face_short_range.tflite
```

---

# 26. P1 — Recommended Before Investor Due Diligence

### P1.1 — Clean upstream product identity

Remove/rebrand leftover:

```text
FaceNet-Android
com.ml.shubham0204.facenet_android
```

references where they are product identity rather than required attribution.

### P1.2 — Preserve upstream attribution

Do not remove required copyright/license notices.

### P1.3 — Add EduVision copyright headers

Add ownership headers to genuinely original EduVision source files.

### P1.4 — Perform complete dependency scan

Scan the full transitive dependency tree.

### P1.5 — Document IP ownership

Make sure founders/team members have appropriate written IP-assignment/confidentiality agreements when the startup is incorporated.

---

# 27. P2 — Recommended Cleanup

- Maintain a centralized third-party license inventory
- Keep model provenance documentation
- Keep copies/references of upstream licenses
- Add an in-app Open Source Licenses screen
- Document major architecture origins
- Maintain a software bill of materials (SBOM) where practical
- Re-run the license audit whenever major dependencies/models change

---

# 28. Final File-by-File Classification

| Component | Origin | Owner | License | Derived? | Commercial Use | Attribution | Risk | Action |
|---|---|---|---|---|---|---|---|---|
| Android module scaffold | Shubham Panchal / upstream | Shubham + EduVision modifications | Apache-2.0 | Yes | Yes | Required | Medium | Preserve license/attribution |
| `FaceNet.kt` | Upstream | Shubham + EduVision | Apache-2.0 | Yes | Yes | Required; currently incomplete | Medium | Fix attribution |
| `FaceSpoofDetector.kt` | Upstream + MiniFASNet + DeepFace | Multiple | Apache-2.0 / MIT | Yes | Yes | Required | Low | Preserve attribution |
| MediaPipe detector | Upstream + EduVision | Multiple | Apache-2.0 framework | Yes | Yes | Required | Low | Verify model terms |
| ML Kit detector | Google SDK | Google | Google/ML Kit terms | Dependency | Yes subject to terms | Terms apply | Medium | Review current terms |
| ObjectBox/DB wiring | Upstream + EduVision extensions | Shubham + EduVision | Apache-2.0 | Yes | Yes | Required | Low | Preserve attribution |
| `AttendanceUseCase.kt` | EduVision | EduVision | Original | No | Yes | N/A | Low | Add copyright header |
| Cloud sync files | EduVision | EduVision | Original | No | Yes | N/A | Low | Add copyright header |
| `SettingsStore.kt` | EduVision | EduVision | Original | No | Yes | N/A | Low | Add copyright header |
| Dashboard | EduVision | EduVision | Original | No | Yes | N/A | Low | Add copyright header |
| `facenet.tflite` | Third-party model | Upstream/model owners | VERIFY | No | VERIFY | VERIFY | Medium | Verify provenance |
| `facenet_512.tflite` | Third-party model | Upstream/model owners | VERIFY | No | VERIFY | VERIFY | Medium | Verify provenance |
| `blaze_face_short_range.tflite` | MediaPipe/Google | Google | Framework Apache-2.0; asset terms VERIFY | No | VERIFY | Required/verify | Low-Medium | Verify asset terms |
| MiniFASNet models | MiniVision | MiniVision | Apache-2.0 | No | Yes | Required | Low | Document in MODEL_LICENSES |
| Dashboard npm dependencies | Upstream projects | Respective owners | Mostly MIT/ISC | No | Yes | Required | Low | Document |

---

# 29. Practical Startup Structure

A clean future structure could look like:

```text
EDUVISION STARTUP
│
├── EduVision Original IP
│   ├── Attendance system
│   ├── Dashboard
│   ├── Supabase integration
│   ├── Cloud synchronization
│   ├── Student management
│   ├── Teacher workflow
│   ├── Original UI/UX
│   └── Product/business logic
│
└── Third-Party Components
    ├── FaceNet-Android-derived code
    ├── FaceNet model
    ├── MiniFASNet
    ├── MediaPipe
    ├── Google ML Kit
    ├── AndroidX
    ├── TensorFlow Lite/LiteRT
    ├── ObjectBox
    └── Other dependencies
```

This is normal for commercial software.

A commercial startup does not need to own every line of code it distributes.

It needs to have the **right to use and distribute each component** and comply with the applicable license/terms.

---

# 30. Final Recommendation

The current audit supports the following practical conclusion:

> **EduVision can proceed toward becoming a commercial startup/product, but it should complete the identified license, attribution, model-provenance, and IP-ownership cleanup before its first serious commercial release or investor due diligence.**

The project does **not** need to be completely rewritten simply because it contains Apache-2.0-derived code.

The preferred strategy is:

```text
Current EduVision
      ↓
License / IP cleanup
      ↓
Model provenance verification
      ↓
Third-party license documentation
      ↓
Upstream identity cleanup
      ↓
Original EduVision IP documentation
      ↓
Team/founder IP assignments
      ↓
Commercial release
      ↓
Startup / investor due diligence
```

---

# 31. Important Legal Boundary

This document is an engineering/business reference based on the repository audit.

It does not provide a legal guarantee that every copyright, trademark, model, dataset, privacy, biometric, or contractual issue has been resolved.

Before commercial launch, especially because EduVision processes facial/biometric information and may be used in schools, obtain professional legal review covering:

- Software licensing
- Copyright
- Model/data provenance
- Trademark
- IP assignment
- Privacy
- Biometric data
- Student/minor data
- Data protection
- Contracts with schools
- Terms of service
- Security obligations

---

# 32. Final Checklist

Before commercial launch:

- [ ] Complete `FaceNet.kt` attribution
- [ ] Create `/NOTICE`
- [ ] Create `/THIRD_PARTY_LICENSES`
- [ ] Create `/MODEL_LICENSES`
- [ ] Verify FaceNet model provenance
- [ ] Verify FaceNet training-data/model restrictions
- [ ] Verify BlazeFace model-asset terms
- [ ] Review current Google ML Kit terms
- [ ] Run a full transitive dependency license scan
- [ ] Preserve Apache-2.0 upstream notices
- [ ] Rebrand upstream package/product identity
- [ ] Remove obsolete upstream funding/product references where appropriate
- [ ] Add EduVision copyright headers to original code
- [ ] Document EduVision vs third-party IP
- [ ] Establish founder/team IP assignments after incorporation
- [ ] Maintain model/dependency provenance records
- [ ] Add in-app Open Source Licenses screen
- [ ] Review privacy/biometric requirements
- [ ] Obtain professional legal review before commercial launch

---

## Key Principle

**Do not try to remove third-party ownership.**

Instead:

> **Own what EduVision genuinely created, license what EduVision legitimately uses, attribute what EduVision inherited, and document everything clearly.**
