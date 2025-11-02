/**
 * @file GraphDisplay.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 *a* @date October 3, 2025 (Last Modified: October 25, 2025)
 *
 * @description
 * This is the core React component for visualizing the proof graph. It uses
 * React Flow to render the nodes and edges provided by the `graphData` prop.
 *
 * It performs two main functions:
 * 1.  Calculates a custom, layer-based hierarchical layout for the graph nodes.
 * 2.  Handles all user interactions, such as node highlighting.
 */

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
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
 * top-down, layer-based layout.
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

      // If all parents of the child have been processed, add it to the queue for the next layer.
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
 * Manages the state for nodes, edges, and user selections, and
 * orchestrates layout calculations and highlighting.
 */
const GraphDisplay = ({ graphData }) => {
  // State for React Flow's controlled nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // State to track which node is currently selected for highlighting
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  /**
   * Memoized callback for when a node is clicked.
   * Toggles the selectedNodeId state.
   */
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(prevSelectedId => (prevSelectedId === node.id ? null : node.id));
  }, []); // Empty dependency array means this function is created only once

  /**
   * Hook 1: (Layout Effect)
   * Runs when new `graphData` arrives from the App component.
   * This hook is responsible for:
   * 1. Transforming the AI's JSON data into React Flow nodes.
   * 2. Preserving any validation data (`isValid`, `critique`) passed from App.js.
   * 3. Calculating the layout positions by calling `getLayoutedElements`.
   * 4. Setting the final nodes and edges state for React Flow.
   *
   * We use `useLayoutEffect` to ensure this runs synchronously before the
   * browser paints, preventing a "flash" of un-layouted nodes.
   */
  useLayoutEffect(() => {
    if (!graphData || !graphData.nodes) return;

    // "Smart" transform: Preserves data from validation runs
    let initialNodes = graphData.nodes.map((node, index) => ({
      ...node, 
      data: {
        ...(node.data || {}), 
        label: node.data?.label || `(${node.id}) ${node.label}`,
      },
      type: 'mathNode',
      position: node.position || { x: 0, y: 0 }, 
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
    setSelectedNodeId(null); // Clear selection
  }, [graphData, setNodes, setEdges]);

  /**
   * Hook 2: (Effect)
   * Runs when the `selectedNodeId` changes (i.e., user clicks a node).
   * This hook handles the interactive highlighting. It loops through all
   * nodes and edges and updates their `style` to dim non-connected elements.
   */
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          node.style = { opacity: 1 }; // Reset style
          return node;
        }
        
        // Check if this node is the selected one or a direct neighbor
        const isConnected = graphData.edges.some(
          (edge) =>
            (String(edge.source) === selectedNodeId && String(edge.target) === node.id) ||
            (String(edge.target) === selectedNodeId && String(edge.source) === node.id)
        );

        node.style = (node.id === selectedNodeId || isConnected)
          ? { opacity: 1 }   // Highlight
          : { opacity: 0.2 }; // Dim
        return node;
      })
    );
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          edge.style = { opacity: 1 }; // Reset style
          return edge;
        }

        // Check if this edge is connected to the selected node
        const isConnected = String(edge.source) === selectedNodeId || String(edge.target) === selectedNodeId;

        edge.style = isConnected ? { opacity: 1 } : { opacity: 0.2 }; // Highlight or Dim
        return edge;
      })
    );
  }, [selectedNodeId, graphData, setNodes, setEdges]); // Rerun when selection changes

  // --- Render the component ---
  return (
    // Container div with custom styling
    <div style={{ height: '98vh', width: '90%', border: '1px solid #61dafb', marginTop: '1px' , borderRadius: '8px', marginBottom: '50px'}}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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