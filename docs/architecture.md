# Logistics Control Tower — System Architecture

## System Overview

The **Logistics Control Tower** (Smart Delivery & Delay Tracker) provides real-time visibility, automated delay detection, deterministic rerouting, and offline-first operational capabilities for high-volume supply chain operations.

```mermaid
flowchart TD
    subgraph Legacy & Ingestion Layer
        RFID[RFID Scanners / IoT Telemetry] -->|MQTT / JSON| IoTCore[AWS IoT Core]
        Queue[Legacy Message Queue Feed] -->|HTTP / Ingest API| APIGW[API Gateway HTTP API]
    end

    subgraph Serverless Processing & Storage
        IoTCore -->|IoT Rule| LambdaIngest[Lambda Ingest Handler]
        APIGW --> LambdaIngest
        LambdaIngest --> DynamoDB[(Amazon DynamoDB)]
        LambdaIngest -->|Publish Event| AppSync[AppSync Events / Realtime WebSocket]
        
        DynamoDB -->|Route Recalculation Request| LambdaRoute[Lambda Dijkstra Router (Python)]
        LambdaRoute -->|Updated Route Path| DynamoDB
        LambdaRoute -->|Reroute Event| AppSync
    end

    subgraph Client Application Layer (Frontend)
        AppSync -->|Realtime Subscriptions| ReactClient[React + TypeScript Frontend]
        ReactClient <---> DexieDB[(Dexie.js / IndexedDB Local Cache)]
        ReactClient -->|Offline Action Queue| SyncEngine[Offline Sync Manager]
        SyncEngine -->|Sync when Reconnected| APIGW
    end
```

---

## 🏗️ Architecture Components

### 1. Frontend Layer
- **Framework**: React 18 + TypeScript + Vite.
- **State Management & Offline Storage**: **Dexie.js** provides IndexedDB storage for offline persistence of active shipments, telemetry updates, and pending sync actions.
- **Map & Visualization**: **MapLibre GL JS** renders interactive multi-city hub networks, vehicle paths, bottleneck heatmaps, and package markers.
- **Connectivity Awareness**: Listens to browser `online`/`offline` window events and manages local offline queuing.

### 2. Ingestion & Realtime Telemetry Layer
- **AWS IoT Core**: Receives MQTT messages from simulated RFID scanners and hub gateways.
- **AWS AppSync Events**: Pushes instantaneous realtime telemetry updates and delay alert triggers directly to browser clients over WebSockets.

### 3. Backend & Rerouting Engine
- **AWS Lambda (Python 3.10+)**: Houses microservices for telemetry validation, state persistence, and route calculation.
- **Deterministic Rerouting Engine (`backend/routing/dijkstra.py`)**: Uses Dijkstra's algorithm to compute shortest paths based on edge weights (distance, traffic delay penalties, hub congestion scores).
- **Explainability Constraint**: All route decisions are 100% deterministic, audit-logged, and mathematical. LLMs are strictly forbidden from deciding routing logic.

### 4. Persistence Layer
- **Amazon DynamoDB**: Single-table design for high-performance retrieval of:
  - `SHIPMENT#<id>`: Current status, origin, destination, ETA, risk status, route path.
  - `HUB#<id>`: Hub location, capacity, delay multiplier.
  - `TELEMETRY#<id>`: Raw RFID scan events log.

---

## 🔒 Security Architecture

1. **Authentication**: Amazon Cognito User Pools for user sign-in and access control.
2. **IAM Authorization**:
   - Least-privilege IAM roles for Lambda execution.
   - Cognito Identity Pools for temporary unauthenticated/authenticated AWS credentials for WebSocket subscriptions.
   - **Zero hardcoded credentials** across all environments.
3. **Audit Trail**: Every reroute event logs the input graph state, edge penalties, and calculated path to CloudWatch Logs for full regulatory compliance.
