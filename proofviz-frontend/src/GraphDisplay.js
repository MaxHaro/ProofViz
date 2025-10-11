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

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const GraphDisplay = ({ graphData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(prevSelectedId => (prevSelectedId === node.id ? null : node.id));
  }, []);

  // Hook 1: Runs ONLY when new graphData arrives from the backend.
  // This builds the initial graph and sets the positions just once.
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    const transformedNodes = graphData.nodes.map((node, index) => ({
      id: String(node.id),
      position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 150 }, // Initial position
      data: { label: `(${node.id}) ${node.label}` },
      type: node.type === 'assumption' || node.type === 'conclusion' ? 'input' : 'default',
    }));

    const transformedEdges = graphData.edges.map((edge, index) => ({
      id: `e${edge.source}-${edge.target}-${index}`,
      source: String(edge.source),
      target: String(edge.target),
      animated: true,
    }));

    setNodes(transformedNodes);
    setEdges(transformedEdges);
    setSelectedNodeId(null); // Clear selection when new data arrives
  }, [graphData, setNodes, setEdges]); // Dependency: Only graphData

  // Hook 2: Runs ONLY when the selected node changes.
  // This handles all the highlighting logic without resetting positions.
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          // If nothing is selected, remove any custom styles
          node.style = { opacity: 1 };
          return node;
        }

        // Find all connected nodes
        const isConnected = graphData.edges.some(
          (edge) =>
            (String(edge.source) === selectedNodeId && String(edge.target) === node.id) ||
            (String(edge.target) === selectedNodeId && String(edge.source) === node.id)
        );

        // Highlight the selected node and its direct neighbors
        if (node.id === selectedNodeId || isConnected) {
          node.style = { opacity: 1 };
        } else {
          node.style = { opacity: 0.2 };
        }
        return node;
      })
    );

    // This part is for the edges, same logic
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isHighlighting = selectedNodeId !== null;
        if (!isHighlighting) {
          edge.style = { opacity: 1 };
          return edge;
        }

        if (String(edge.source) === selectedNodeId || String(edge.target) === selectedNodeId) {
          edge.style = { opacity: 1 };
        } else {
          edge.style = { opacity: 0.2 };
        }
        return edge;
      })
    );
  }, [selectedNodeId, graphData, setNodes, setEdges]); // Dependencies: selectedNodeId and graphData

  return (
    <div style={{ height: '70vh', width: '90%', border: '1px solid #61dafb', marginTop: '20px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;