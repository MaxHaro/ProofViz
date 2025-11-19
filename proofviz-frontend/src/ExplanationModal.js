/**
 * @file ExplanationModal.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 25, 2025
 *
 * @description
 * A simple modal component to display the AI-generated explanation
 * for a specific logical step (edge).
 */

import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

const ExplanationModal = ({ content, onClose, isLoading }) => {
  if (!content && !isLoading) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Logical Step Explanation</h3>
        
        <div className="explanation-body">
          {isLoading ? (
            <p className="loading-text">Analyzing logic...</p>
          ) : (
            // Use standard p tags for better readability of the explanation
            <p><Latex>{content}</Latex></p>
          )}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ExplanationModal;