"""
Dijkstra's Shortest Path Algorithm for Logistics Rerouting.

Requirements:
- REQ-2: Use a simple route-finding algorithm to recalculate the fastest alternative path when a delay is detected.
- Deterministic and explainable.
- The LLM must NEVER decide the route.
"""

import heapq
from typing import Dict, List, Optional, Tuple, Any

class Graph:
    """Represents a logistics hub network graph with dynamic edge weights (minutes)."""
    
    def __init__(self):
        # Adj list: node -> List of (neighbor, weight)
        self.adj: Dict[str, List[Tuple[str, float]]] = {}
    
    def add_edge(self, u: str, v: str, weight: float, bidirectional: bool = True) -> None:
        """Add an edge between hubs u and v with transit weight (in minutes)."""
        if u not in self.adj:
            self.adj[u] = []
        self.adj[u].append((v, weight))
        
        if bidirectional:
            if v not in self.adj:
                self.adj[v] = []
            self.adj[v].append((u, weight))

    def update_edge_weight(self, u: str, v: str, new_weight: float, bidirectional: bool = True) -> None:
        """Dynamically update edge weight (e.g. adding delay penalty due to congestion or weather)."""
        if u in self.adj:
            self.adj[u] = [(nbr, w if nbr != v else new_weight) for nbr, w in self.adj[u]]
        if bidirectional and v in self.adj:
            self.adj[v] = [(nbr, w if nbr != u else new_weight) for nbr, w in self.adj[v]]


def find_fastest_route(graph: Graph, start: str, destination: str) -> Dict[str, Any]:
    """
    Recalculates the fastest route from start to destination using Dijkstra's algorithm.

    Returns dict containing:
    - 'path': List[str] node sequence
    - 'total_time_minutes': float
    - 'found': bool
    - 'explanation': str
    """
    if start not in graph.adj or destination not in graph.adj:
        return {
            "found": False,
            "path": [],
            "total_time_minutes": float('inf'),
            "explanation": f"Either start node '{start}' or destination node '{destination}' does not exist in graph."
        }
        
    distances: Dict[str, float] = {node: float('inf') for node in graph.adj}
    previous: Dict[str, Optional[str]] = {node: None for node in graph.adj}
    distances[start] = 0.0
    
    # Priority Queue stores (current_distance, node)
    pq: List[Tuple[float, str]] = [(0.0, start)]
    
    while pq:
        current_dist, current_node = heapq.heappop(pq)
        
        if current_node == destination:
            break
            
        if current_dist > distances[current_node]:
            continue
            
        for neighbor, weight in graph.adj.get(current_node, []):
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))
                
    if distances[destination] == float('inf'):
        return {
            "found": False,
            "path": [],
            "total_time_minutes": float('inf'),
            "explanation": f"No valid route found connecting '{start}' to '{destination}'."
        }
        
    # Reconstruct path
    path = []
    curr: Optional[str] = destination
    while curr is not None:
        path.append(curr)
        curr = previous[curr]
    path.reverse()
    
    return {
        "found": True,
        "path": path,
        "total_time_minutes": round(distances[destination], 2),
        "explanation": f"Calculated deterministic optimal path from '{start}' to '{destination}' via {len(path)} hubs with ETA impact of {round(distances[destination], 2)} mins."
    }

if __name__ == "__main__":
    # Quick demo run
    g = Graph()
    g.add_edge("Hub-Chicago", "Hub-Indianapolis", 180)
    g.add_edge("Hub-Chicago", "Hub-StLouis", 300)
    g.add_edge("Hub-Indianapolis", "Hub-Columbus", 120)
    g.add_edge("Hub-StLouis", "Hub-Columbus", 240)
    
    res = find_fastest_route(g, "Hub-Chicago", "Hub-Columbus")
    print("Normal Route:", res)
    
    # Simulate dynamic delay on Chicago -> Indianapolis route (e.g. accident adding 500 mins)
    g.update_edge_weight("Hub-Chicago", "Hub-Indianapolis", 680)
    res_rerouted = find_fastest_route(g, "Hub-Chicago", "Hub-Columbus")
    print("Rerouted Path after Delay:", res_rerouted)
