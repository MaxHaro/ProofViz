/**
 * @file GraphDisplay.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 3, 2025
 *
 * @description
 * A React component responsible for rendering the mathematical proof's
 * logical graph. It uses the React Flow library to display nodes and
 * edges based on the data received from the backend.
 */

import React, { useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const GraphDisplay = ({ graphData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // "useEffect" runs whenever the graphData prop changes.
  useEffect(() => {
    if (graphData && graphData.nodes) {
      // Here we transform our AI's node format into React Flow's format.
      const transformedNodes = graphData.nodes.map((node, index) => ({
        id: String(node.id), 
        position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 150 }, 
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
    }
  }, [graphData, setNodes, setEdges]); 

  return (
    <div style={{ height: '70vh', width: '90%', border: '1px solid #61dafb', marginTop: '20px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default GraphDisplay;