/**
 * @file GraphDisplay.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 3, 2025 (Last Modified: October 11, 2025)
 *
 * @description
 * A React component responsible for rendering the mathematical proof's
 * logical graph. It uses the React Flow library to display nodes and
 * edges based on the data received from the backend. It also includes
 * interactive highlighting to show a node's dependencies upon click.
 */

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Background, Controls } from 'reactflow';
import MathNode from './MathNode';
import 'reactflow/dist/style.css';

// --- NEW CUSTOM LAYOUT FUNCTION (Replaces Dagre) ---

// Define our node dimensions
const nodeWidth = 250;
const nodeHeight = 100; // You might need to adjust this
const horizontalSpacing = 50;
const verticalSpacing = 50;

const getLayoutedElements = (nodes, edges) => {
  // 1. Create data structures to hold graph info
  const adjList = new Map(); // (nodeId) => [childId, childId, ...]
  const inDegree = new Map(); // (nodeId) => number of incoming edges

  nodes.forEach((node) => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    // Add child to adjacency list
    if (!adjList.has(edge.source)) adjList.set(edge.source, []);
    adjList.get(edge.source).push(edge.target);
    
    // Increment in-degree of target node
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // 2. Find all root nodes (in-degree === 0)
  const rootNodes = nodes.filter((node) => inDegree.get(node.id) === 0);

  // 3. Perform a layered layout (BFS-based topological sort)
  const layers = new Map();     // (nodeId) => layerNumber
  const layerCounts = new Map(); // (layerNumber) => count of nodes in this layer
  const queue = [];

  rootNodes.forEach((node) => {
    queue.push(node.id);
    layers.set(node.id, 0);
  });

  let maxLayer = 0;

  while (queue.length > 0) {
    const nodeId = queue.shift();
    const layer = layers.get(nodeId);
    maxLayer = Math.max(maxLayer, layer);

    // Get position within the layer
    const indexInLayer = layerCounts.get(layer) || 0;
    layerCounts.set(layer, indexInLayer + 1);

    // Find the node object and set its position
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      node.position = {
        x: indexInLayer * (nodeWidth + horizontalSpacing),
        y: layer * (nodeHeight + verticalSpacing),
      };
    }

    // Process children
    (adjList.get(nodeId) || []).forEach((childId) => {
      // For each child, decrement its in-degree
      const newInDegree = (inDegree.get(childId) || 0) - 1;
      inDegree.set(childId, newInDegree);

      // If in-degree is 0, it's ready to be placed in the next layer
      if (newInDegree === 0) {
        layers.set(childId, layer + 1);
        queue.push(childId);
      }
    });
  }

  // 4. Center each layer horizontally
  const maxLayerWidth = Math.max(...Array.from(layerCounts.values()));
  const totalWidth = maxLayerWidth * nodeWidth + (maxLayerWidth - 1) * horizontalSpacing;

  nodes.forEach((node) => {
    const layer = layers.get(node.id);
    const nodesInThisLayer = layerCounts.get(layer);
    const layerWidth = nodesInThisLayer * nodeWidth + (nodesInThisLayer - 1) * horizontalSpacing;
    const offsetX = (totalWidth - layerWidth) / 2;
    
    node.position.x += offsetX;
  });

  return { nodes, edges };
};
// --- END OF LAYlayout FUNCTION ---

const nodeTypes = { mathNode: MathNode };

const GraphDisplay = ({ graphData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(prevSelectedId => (prevSelectedId === node.id ? null : node.id));
  }, []);

  // Hook 1: Builds the initial graph and CALCULATES LAYOUT
  useLayoutEffect(() => {
    if (!graphData || !graphData.nodes) return;

    // Create the nodes and edges without positions
    let initialNodes = graphData.nodes.map((node, index) => ({
      id: String(node.id),
      data: { label: `(${node.id}) ${node.label}` },
      type: 'mathNode',
      position: { x: 0, y: 0 }, // Will be set by our algorithm
    }));

    let initialEdges = graphData.edges.map((edge, index) => ({
      id: `e${edge.source}-${edge.target}-${index}`,
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
    }));

    // Call our new layout function
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setSelectedNodeId(null);
  }, [graphData, setNodes, setEdges]);

  // Hook 2: Handles highlighting (This hook remains the same)
  useEffect(() => {
    // ... (Your highlighting logic doesn't need to change)
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          node.style = { opacity: 1 }; return node;
        }
        const isConnected = graphData.edges.some(
          (edge) =>
            (String(edge.source) === selectedNodeId && String(edge.target) === node.id) ||
            (String(edge.target) === selectedNodeId && String(edge.source) === node.id)
        );
        if (node.id === selectedNodeId || isConnected) {
          node.style = { opacity: 1 };
        } else {
          node.style = { opacity: 0.2 };
        }
        return node;
      })
    );
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          edge.style = { opacity: 1 }; return edge;
        }
        if (String(edge.source) === selectedNodeId || String(edge.target) === selectedNodeId) {
          edge.style = { opacity: 1 };
        } else {
          edge.style = { opacity: 0.2 };
        }
        return edge;
      })
    );
  }, [selectedNodeId, graphData, setNodes, setEdges]);

  return (
    <div style={{ height: '70vh', width: '90%', border: '1px solid #61dafb', marginTop: '20px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;