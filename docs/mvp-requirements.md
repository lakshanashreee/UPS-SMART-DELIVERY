# Logistics Control Tower — MVP Requirements Specification

> **Use Case ID**: 2026 GH-CT-02  
> **Problem Name**: Smart Delivery & Delay Tracker

---

## 🎯 Mandatory MVP Requirements Checklist

| Req # | Requirement Name | Description | Tech Implementation | Acceptance Criteria |
|---|---|---|---|---|
| **REQ-1** | Live Package Location & Risk Alerts | Display live package movements on a map and highlight shipments at risk of missing delivery deadlines. | React, MapLibre GL JS, Tailwind status badges | Package location updates live on map; delayed packages trigger visual high-risk warnings (red glow / status badge). |
| **REQ-2** | Deterministic Route Recalculation | Use a simple route-finding algorithm to recalculate the fastest alternative path when a delay is detected. | Python, Dijkstra's algorithm (`backend/routing/dijkstra.py`) | Detect bottleneck/delay, trigger Dijkstra calculation, produce explainable new path node sequence and revised ETA. |
| **REQ-3** | Offline Data Storage & Auto-Sync | Store data locally so the app works offline and automatically syncs when connected. | Dexie.js (IndexedDB), HTML5 Online/Offline API | App remains fully usable without internet; scans & actions queued in Dexie; auto-syncs when online event fires. |
| **REQ-4** | Mock Legacy Feed Integration | Connect to a mock legacy system feed simulating RFID scanner inputs or message queue streams. | Admin Legacy Simulator UI, AWS IoT Core / MQTT / Event Stream | Simulator emits mock RFID scan payloads; updates package location, timestamp, and hub status in real time. |

---

## 🚦 Roadmap & Phase Breakdown

### Phase 0: Project Foundation (Current Phase)
- Setup project repository (`/frontend`, `/backend`, `/infrastructure`, `/docs`).
- Create React + TypeScript + Vite frontend shell with navigation, pages, and offline indicator.
- Implement Python Dijkstra routing module and unit tests.
- Create Terraform IaC configuration baseline for `us-east-1`.
- Complete documentation (`README.md`, `architecture.md`, `mvp-requirements.md`).

### Phase 1: Core Functional MVP
- Wire Dexie.js database schema for local offline storage.
- Connect Admin Simulator to frontend live state and Dexie offline queue.
- Render MapLibre map with interactive hubs, package paths, and live delay markers.
- Implement UI reroute trigger calling local Python Dijkstra recalculation logic.

### Phase 2: AWS Cloud Infrastructure Integration
- Deploy Terraform resources (Cognito, DynamoDB, API Gateway, AppSync Events, Lambda, IoT Core).
- Connect legacy feed simulator to AWS IoT Core / API Gateway.
- Implement AWS Lambda trigger for Dijkstra rerouting engine.

### Phase 3: AI & Bedrock Enhancements (Post-MVP Optional)
- Add Amazon Bedrock natural language delay summaries and natural language routing queries.
- *Strict Rule: Bedrock is added ONLY after REQ-1 through REQ-4 are 100% complete and validated.*
