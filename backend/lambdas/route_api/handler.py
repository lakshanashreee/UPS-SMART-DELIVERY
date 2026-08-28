import json
import logging
import heapq

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def dijkstra_shortest_path(nodes, edges, start, goal):
    """
    Deterministic Dijkstra shortest path algorithm.
    """
    graph = {node: {} for node in nodes}
    for edge in edges:
        u, v, w = edge["source"], edge["target"], edge["weight"]
        graph[u][v] = w
        graph[v][u] = w

    queue = [(0, start, [start])]
    visited = set()

    while queue:
        (cost, current, path) = heapq.heappop(queue)
        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            return path, cost

        for neighbor, weight in graph.get(current, {}).items():
            if neighbor not in visited:
                heapq.heappush(queue, (cost + weight, neighbor, path + [neighbor]))

    return None, float("inf")

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }

    try:
        payload = json.loads(event.get("body", "{}"))
        start = payload.get("origin", "HUB_A")
        goal = payload.get("destination", "HUB_D")
        custom_edges = payload.get("edges")

        default_nodes = ["HUB_A", "HUB_B", "HUB_C", "HUB_D"]
        default_edges = [
            {"source": "HUB_A", "target": "HUB_B", "weight": 2.5},
            {"source": "HUB_B", "target": "HUB_D", "weight": 15.0}, # Congested
            {"source": "HUB_A", "target": "HUB_C", "weight": 4.0},
            {"source": "HUB_C", "target": "HUB_D", "weight": 6.0}
        ]

        edges_to_use = custom_edges if custom_edges is not None else default_edges
        path, total_cost = dijkstra_shortest_path(default_nodes, edges_to_use, start, goal)

        body = {
            "origin": start,
            "destination": goal,
            "optimalPath": path,
            "totalCost": total_cost,
            "algorithm": "Dijkstra (Deterministic)",
            "explainability": f"Recalculated path using shortest path edge weights. Path chosen: {' -> '.join(path or [])}."
        }
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(body)
        }
    except Exception as e:
        logger.error("Error calculating route: %s", str(e))
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
