import unittest

try:
    from routing.dijkstra import Graph, find_fastest_route
except ImportError:
    from backend.routing.dijkstra import Graph, find_fastest_route

class TestDijkstraRouting(unittest.TestCase):
    
    def setUp(self):
        self.graph = Graph()
        # Sample logistics hub network
        # NYC -> PHI (100m)
        # PHI -> BAL (80m)
        # BAL -> WDC (40m)
        # NYC -> HAR (160m)
        # HAR -> WDC (130m)
        self.graph.add_edge("NYC", "PHI", 100)
        self.graph.add_edge("PHI", "BAL", 80)
        self.graph.add_edge("BAL", "WDC", 40)
        self.graph.add_edge("NYC", "HAR", 160)
        self.graph.add_edge("HAR", "WDC", 130)

    def test_fastest_route_normal(self):
        result = find_fastest_route(self.graph, "NYC", "WDC")
        self.assertTrue(result["found"])
        self.assertEqual(result["path"], ["NYC", "PHI", "BAL", "WDC"])
        self.assertEqual(result["total_time_minutes"], 220)

    def test_reroute_on_delay(self):
        # Introduce a major 300-min delay on PHI -> BAL route
        self.graph.update_edge_weight("PHI", "BAL", 380)
        result = find_fastest_route(self.graph, "NYC", "WDC")
        self.assertTrue(result["found"])
        # Should now reroute via Harrisburg (NYC -> HAR -> WDC = 290 mins)
        self.assertEqual(result["path"], ["NYC", "HAR", "WDC"])
        self.assertEqual(result["total_time_minutes"], 290)

    def test_unreachable_destination(self):
        result = find_fastest_route(self.graph, "NYC", "UNKNOWN_HUB")
        self.assertFalse(result["found"])
        self.assertEqual(result["path"], [])

if __name__ == "__main__":
    unittest.main()
