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
 * This version is interactive: clicking a concept highlights the
 * corresponding nodes in the graph.
 */

import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css'; // Required for KaTeX styling

/**
 * A component that displays a list of key concepts.
 *
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.concepts - An array of concept objects,
 * each with "name", "description", and "used_in_nodes".
 * @param {Function} props.onConceptClick - Callback function passed from App.js
 * to highlight nodes in the graph when a concept is clicked.
 * @returns {JSX.Element} The rendered concepts window.
 */
const ConceptsWindow = ({ concepts, onConceptClick }) => {

  /**
   * @callback handleClick
   * @description A helper function to safely call the onConceptClick prop
   * with the node IDs associated with the clicked concept.
   * @param {Object} concept - The concept object that was clicked.
   */
  const handleClick = (concept) => {
    // Check if the prop was passed before calling it
    if (onConceptClick) {
      onConceptClick(concept.used_in_nodes);
    }
  };

  return (
    <div className="concepts-window">
      <h3>Key Concepts Used:</h3>
      
      {/* Conditionally render the list:
        - If the concepts array is not empty, map over it and display each concept.
        - If it is empty, display a fallback "No concepts" message.
      */}
      {concepts.length > 0 ? (
        <ul>
          {concepts.map((concept, index) => (
            // This list item is now clickable
            <li 
              key={index}
              className="concept-item" // Added for CSS hover/cursor styling
              onClick={() => handleClick(concept)}
              title="Click to highlight related nodes" // Browser tooltip
            >
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