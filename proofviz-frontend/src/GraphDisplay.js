/**
 * @file GraphDisplay.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 *a* @date October 3, 2025 (Last Modified: October 25, 2025)
 *
 * @description
 * This component visualizes the proof graph using React Flow.
 * It is a "controlled" component: it receives all its interaction logic (like
 * highlighting) as props from the parent App component. Its main
 * responsibilities are to calculate the graph layout and apply styles
 * based on the props it receives.
 */

import React, { useEffect, useLayoutEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Background, Controls } from 'reactflow';
import MathNode from './MathNode';
import 'reactflow/dist/style.css';

// =============================================================================
// Graph Layout Algorithm
// =============================================================================

// Define default node dimensions and spacing for the layout algorithm.
const nodeWidth = 500;
const nodeHeight = 100;
const horizontalSpacing = 100;
const verticalSpacing = 100;

/**
 * Calculates the (x, y) position for each node to create a hierarchical,
 * top-down, layer-based layout based on the proof's dependencies.
 *
 * @param {Array} nodes - The initial array of nodes from React Flow.
 * @param {Array} edges - The initial array of edges from React Flow.
 * @returns {Object} An object { nodes, edges } with updated positions.
 */
const getLayoutedElements = (nodes, edges) => {
  // 1. Build helper maps for graph traversal.
  const adjList = new Map(); // Stores child nodes for each node ID
  const inDegree = new Map(); // Stores the count of incoming edges for each node ID

  nodes.forEach((node) => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (adjList.has(edge.source)) {
      adjList.get(edge.source).push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // 2. Find all "root" nodes (nodes with 0 incoming edges, e.g., assumptions).
  const rootNodes = nodes.filter((node) => inDegree.get(node.id) === 0);

  // 3. Perform a layered layout using a Breadth-First Search (BFS) approach.
  const layers = new Map();     // Stores {nodeId => layerIndex}
  const layerCounts = new Map(); // Stores {layerIndex => countOfNodesInLayer}
  const queue = [];

  rootNodes.forEach((node) => {
    queue.push(node.id);
    layers.set(node.id, 0); // All root nodes are in Layer 0
  });

  let maxLayer = 0;

  while (queue.length > 0) {
    const nodeId = queue.shift();
    const layer = layers.get(nodeId);
    maxLayer = Math.max(maxLayer, layer);

    // Get the node's horizontal index within its layer.
    const indexInLayer = layerCounts.get(layer) || 0;
    layerCounts.set(layer, indexInLayer + 1);

    // Find the node object to update its position.
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      node.position = {
        x: indexInLayer * (nodeWidth + horizontalSpacing),
        y: layer * (nodeHeight + verticalSpacing),
      };
    }

    // Process all children of the current node.
    (adjList.get(nodeId) || []).forEach((childId) => {
      // Decrement the child's in-degree count.
      const newInDegree = (inDegree.get(childId) || 0) - 1;
      inDegree.set(childId, newInDegree);

      // If all parents of the child have been processed, add it to the queue.
      if (newInDegree === 0) {
        layers.set(childId, layer + 1);
        queue.push(childId);
      }
    });
  }

  // 4. Center each layer horizontally for a cleaner pyramid/tree shape.
  const maxLayerWidth = Math.max(...Array.from(layerCounts.values()));
  const totalWidth = maxLayerWidth * nodeWidth + (maxLayerWidth - 1) * horizontalSpacing;

  nodes.forEach((node) => {
    const layer = layers.get(node.id);
    const nodesInThisLayer = layerCounts.get(layer);
    const layerWidth = nodesInThisLayer * nodeWidth + (nodesInThisLayer - 1) * horizontalSpacing;
    // Calculate the horizontal offset to center this layer.
    const offsetX = (totalWidth - layerWidth) / 2;
    
    node.position.x += offsetX;
  });

  return { nodes, edges };
};

// =============================================================================
// React Flow Component
// =============================================================================

// Register our custom 'MathNode' component with React Flow.
const nodeTypes = { mathNode: MathNode };

/**
 * The main component for the React Flow graph.
 * This component is "controlled" by the App component. It receives the
 * graph data and highlighting instructions as props.
 *
 * @param {Object} props - The component props.
 * @param {Object} props.graphData - The full graph data (nodes, edges) from the AI.
 * @param {Set<string>} props.highlightedNodes - A Set of node IDs to highlight.
 * @param {Function} props.onNodeClick - Callback function from App.js to run on node click.
 * @param {Function} props.onPaneClick - Callback function from App.js to run on pane click.
 */
const GraphDisplay = ({ graphData, highlightedNodes, onNodeClick, onPaneClick }) => {
  // State for React Flow's controlled nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /**
   * Hook 1: (Layout Effect)
   * Runs when new `graphData` arrives.
   * This hook transforms the AI's JSON into React Flow nodes, calculates
   * the layout, and sets the state for React Flow to render.
   *
   * We use `useLayoutEffect` to run this *before* the browser paints,
   * preventing a "flash" of un-layouted nodes.
   */
  useLayoutEffect(() => {
    if (!graphData || !graphData.nodes) return;

    // "Smart" transform: Preserves data (like `isValid`) from validation runs
    let initialNodes = graphData.nodes.map((node, index) => ({
      ...node, 
      data: {
        ...(node.data || {}), 
        // Use the existing label if it's already in 'data' (from validation),
        // otherwise create the label from the raw node.
        label: node.data?.label || `(${node.id}) ${node.label}`,
      },
      type: 'mathNode',
      position: node.position || { x: 0, y: 0 }, // Preserve position if it exists
    }));

    let initialEdges = graphData.edges.map((edge, index) => ({
      id: `e${edge.source}-${edge.target}-${index}`,
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
    }));

    // Calculate the layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graphData, setNodes, setEdges]); // Rerun only when graphData changes

  /**
   * Hook 2: (Effect)
   * Runs when the `highlightedNodes` prop from App.js changes.
   * This hook handles the interactive highlighting. It loops through all
   * nodes and edges and updates their `style` to dim non-selected elements.
   */
  useEffect(() => {
    // This prop now controls highlighting
    const isHighlighting = highlightedNodes.size > 0;

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        // Apply dimming style if highlighting is active and node is NOT in the set
        style: { opacity: isHighlighting && !highlightedNodes.has(node.id) ? 0.2 : 1 }
      }))
    );
    
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        // Highlight an edge if BOTH its source and target are also highlighted
        style: { 
          opacity: isHighlighting && !(highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target)) 
            ? 0.2 
            : 1 
        }
      }))
    );
  }, [highlightedNodes, setNodes, setEdges]); // Rerun when highlight prop changes

  // --- Render the component ---
  return (
    // Container div with custom styling
    <div style={{ height: '98vh', width: '90%', border: '1px solid #61dafb', marginTop: '1px' , borderRadius: '8px', marginBottom: '50px'}}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // Pass the click handlers up to the App component
        onNodeClick={(event, node) => onNodeClick(node.id)}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes} // Tell React Flow to use our 'mathNode'
        fitView // Automatically zoom/pan to fit the graph
        minZoom={0.2} // Allow user to zoom out further
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;