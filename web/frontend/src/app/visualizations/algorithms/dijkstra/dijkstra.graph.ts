export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
}

// Small hand-crafted undirected graph for demo. Layout positions are in
// SVG user units; the component sets a matching viewBox.
export const SAMPLE_GRAPH: Graph = {
  source: 'A',
  nodes: [
    { id: 'A', x: 80,  y: 200 },
    { id: 'B', x: 240, y: 80  },
    { id: 'C', x: 240, y: 320 },
    { id: 'D', x: 400, y: 200 },
    { id: 'E', x: 560, y: 80  },
    { id: 'F', x: 560, y: 320 },
    { id: 'G', x: 720, y: 200 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 8 },
    { from: 'C', to: 'F', weight: 10 },
    { from: 'D', to: 'E', weight: 2 },
    { from: 'D', to: 'F', weight: 6 },
    { from: 'E', to: 'G', weight: 3 },
    { from: 'F', to: 'G', weight: 4 },
  ],
};
