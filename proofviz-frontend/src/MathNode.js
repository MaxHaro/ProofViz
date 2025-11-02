/**
 * @file MathNode.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 24, 2025
 *
 * @description
 * This file defines a custom React Flow node component (`MathNode`).
 * This component is responsible for rendering the content of a single
 * proof step. It uses `react-latex-next` to display the math, and
 * dynamically changes its style based on validation status (isValid, critique)
 * passed in its `data` prop.
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css'; // Required for KaTeX styling

/**
 * A custom React Flow node component for displaying a proof step.
 *
 * @param {Object} props - Props passed by React Flow.
 * @param {string} props.id - The unique ID of the node.
 * @param {Object} props.data - The data object for the node, containing label and validation info.
 * @param {boolean} props.data.isValid - Whether the proof step is logically valid.
 * @param {string} props.data.critique - An explanation of the flaw, if any.
 * @param {string} props.data.label - The text content of the node, including LaTeX.
 * @param {boolean} props.isConnectable - Prop from React Flow.
 * @param {boolean} props.isSelected - Prop from React Flow (currently unused but available).
 * @returns {JSX.Element} The rendered node component.
 */
const MathNode = ({ id, data, isConnectable, isSelected }) => {
  // --- Validation Logic ---
  // Check for the validation fields.
  // Default to `true` (valid) if the `isValid` field hasn't been set yet (i.e., before validation is run).
  const isValid = data.isValid === undefined ? true : data.isValid;
  const critique = data.critique || ""; // Default to an empty string

  return (
    <div
      className="math-node"
      // --- Dynamic Styling ---
      // Dynamically set the border and background color based on validation status.
      style={{
        border: isValid ? '2px solid #555' : '2px solid #e63946', // Red border if invalid
        borderRadius: '5px',
        background: isValid ? '#f0f0f0' : '#fff0f0', // Light red background if invalid
        color: '#333',
        textAlign: 'center',
        position: 'relative', // Required for positioning the warning icon
      }}
      // --- Tooltip ---
      // Set the browser's default tooltip (on hover).
      // If valid, show an empty string. If invalid, show the critique.
      title={isValid ? "" : critique}
    >
      {/* --- Warning Icon --- */}
      {/* Conditionally render the warning icon ONLY if the node is invalid. */}
      {!isValid && (
        <div className="warning-icon" title={critique}>
          ⚠️
        </div>
      )}

      {/* React Flow Handles: These are the connection points for edges. */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      
      {/* Node Content */}
      <div className="math-node-label">
        <Latex>{data.label}</Latex>
      </div>
      
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
};

export default MathNode;