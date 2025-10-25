import React from 'react';
import { Handle, Position } from 'reactflow';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css'; 

const MathNode = ({ data }) => {
  return (
    <div style={{
      padding: '10px 15px',
      border: '1px solid #1a192b',
      borderRadius: '5px',
      background: '#f0f0f0',
      color: '#333',
      textAlign: 'center'
    }}>
      <Handle type="target" position={Position.Top} />
      <div>
        <Latex>{data.label}</Latex>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default MathNode;