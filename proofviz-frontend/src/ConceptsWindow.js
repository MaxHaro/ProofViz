import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

const ConceptsWindow = ({ concepts }) => {
  return (
    <div className="concepts-window">
      <h3>Key Concepts Used</h3>
      {concepts.length > 0 ? (
        <ul>
          {concepts.map((concept, index) => (
            <li key={index}>
              <strong><Latex>{concept.name}</Latex>:</strong>
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