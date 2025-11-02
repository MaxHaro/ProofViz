/**
 * @file ConceptsWindow.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 24, 2025
 *
 * @description
 * This React component renders a sidebar window that displays a list of
 * "Key Concepts" (theorems, definitions, etc.) extracted from the proof.
 * It uses `react-latex-next` to render any math notation.
 */

import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css'; // Required for KaTeX styling

/**
 * A component that displays a list of key concepts.
 *
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.concepts - An array of concept objects,
 * each with a "name" and "description" property.
 * @returns {JSX.Element} The rendered concepts window.
 */
const ConceptsWindow = ({ concepts }) => {
  return (
    <div className="concepts-window">
      <h3>Key Concepts Used</h3>
      
      {/* Conditionally render the list:
        - If the concepts array is not empty, map over it and display each concept.
        - If it is empty, display a fallback "No concepts" message.
      */}
      {concepts.length > 0 ? (
        <ul>
          {concepts.map((concept, index) => (
            <li key={index}>
              {/* Use <Latex> component to render math in the concept name */}
              <strong><Latex>{concept.name}</Latex>:</strong>
              
              {/* Use <Latex> component to render math in the description */}
              <span> <Latex>{concept.description}</Latex></span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No specific theorems or definitions were identified.</p>
      )}
    </div>
  );
};

export default ConceptsWindow;