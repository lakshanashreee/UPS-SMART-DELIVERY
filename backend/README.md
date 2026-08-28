# Backend & Routing Services

This directory contains Python services and deterministic route-recalculation modules for the Logistics Control Tower MVP.

---

## 🧭 Deterministic Rerouting Engine (`routing/dijkstra.py`)

Per mandatory requirement REQ-2, path recalculation is performed using **Dijkstra's shortest path algorithm**.

### Features:
- **Deterministic & Explainable**: Computes optimal paths based strictly on edge weights (transit time, distance, delay penalties).
- **Dynamic Weight Adjustments**: When hub congestion or route delays are detected, edge weights are updated dynamically.
- **LLM Excluded**: LLMs are never used for route selection to guarantee 100% mathematical precision and reproducibility.

---

## 🧪 Testing the Routing Logic

Run unit tests using Python's built-in `unittest`:

```bash
cd backend
python -m unittest discover -s routing -p "test_*.py"
```
