/**
 * @file App.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 3, 2025
 *
 * @description
 * This is the main React component and container for the ProofViz application.
 * It manages the top-level application state (user input, graph data, loading status)
 * and orchestrates the API calls to the backend for processing and validation.
 */

import './App.css';
import React, { useState } from 'react';
import axios from 'axios';
import GraphDisplay from './GraphDisplay';
import ConceptsWindow from './ConceptsWindow';

function App() {
  /**
   * @state {string} proofText - Stores the raw LaTeX string from the user's textarea.
   */
  const [proofText, setProofText] = useState('');
  
  /**
   * @state {Object | null} graphData - Stores the complete JSON response from the
   * /process-proof endpoint, including nodes, edges, and key_concepts.
   */
  const [graphData, setGraphData] = useState(null);
  
  /**
   * @state {boolean} isLoading - Tracks the loading state for the initial graph generation.
   */
  const [isLoading, setIsLoading] = useState(false);
  
  /**
   * @state {string} validationStatus - Tracks the state of the validation button.
   * ('idle', 'loading', 'success')
   */
  const [validationStatus, setValidationStatus] = useState('idle');
  
  /**
   * @state {string | null} error - Stores any user-facing error messages.
   */
  const [error, setError] = useState(null);

  /**
   * Handles the primary "Visualize Proof" action.
   * Sends the LaTeX proof to the backend, receives the structured graph,
   * and updates the state to render the visualization.
   */
  const handleSubmit = async () => {
    setIsLoading(true);
    setValidationStatus('idle'); // Reset validation button on new proof
    setError(null);
    setGraphData(null); 
    
    try {
      const response = await axios.post('http://localhost:5000/process-proof', {
        proof: proofText
      });
      // Store the full graph structure (nodes, edges, key_concepts)
      setGraphData(response.data); 
    } catch (err) {
      console.error("Error fetching data from backend:", err);
      setError("Failed to generate visualization. Please check the proof or try again.");
    } finally {
      setIsLoading(false); 
    }
  };

  /**
   * Handles the "Validate Logic" action.
   * Sends the existing proof and graph data to the validation endpoint.
   * It then merges the returned validation (isValid, critique) into the
   * existing graphData state, triggering a re-render of the nodes.
   */
  const handleValidate = async () => {
    if (!graphData) return; 

    setValidationStatus('loading');
    setError(null);

    try {
      // Call the validation endpoint with both the proof and the graph
      const response = await axios.post('http://localhost:5000/validate-proof', {
        proof: proofText,  
        graphData: graphData 
      });

      const validationResults = response.data; // e.g., {"N1": {isValid...}, ...}
      
      // Check if all returned nodes are valid to provide success feedback
      const allValid = Object.values(validationResults).every(node => node.isValid === true);
      
      // Non-destructively merge the validation data into the existing node state
      setGraphData(prevGraphData => {
        const newNodes = prevGraphData.nodes.map(node => {
          const validation = validationResults[node.id];
          if (validation) {
            // Return a new node object, merging validation results into the 'data' prop
            return {
              ...node,
              data: {
                ...node.data, 
                isValid: validation.isValid,
                critique: validation.critique
              }
            };
          }
          // If no validation for this node, return it unchanged
          return node;
        });
        
        // Return the new application state
        return {
          ...prevGraphData,
          nodes: newNodes
        };
      });
      
      // Update the button UI based on the validation result
      if (allValid) {
        setValidationStatus('success');
        // Revert button back to normal after 2.5 seconds
        setTimeout(() => setValidationStatus('idle'), 2500);
      } else {
        setValidationStatus('idle'); // Back to idle if flaws were found
      }

    } catch (err) {
      console.error("Error fetching validation data:", err);
      setError("Failed to validate proof. Please try again.");
      setValidationStatus('idle'); // Reset on error
    }
  };

  // --- Render the main component ---
  return (
    <div className="App">
      <header className="App-header">
        <h1>ProofViz 🔬</h1>
        <p>Paste your LaTeX mathematical proof below to visualize its logical structure.</p>
        
        {/* Controlled component for user input */}
        <textarea
          className="proof-textarea"
          value={proofText}
          onChange={e => setProofText(e.target.value)}
          placeholder="e.g., Assume for the sake of contradiction that $\sqrt{2}$ is rational..."
        />

        {/* --- Action Buttons --- */}
        <div className="button-container"> 
          <button 
            className="submit-button" 
            onClick={handleSubmit} 
            disabled={isLoading} 
          >
            {isLoading ? 'Visualizing...' : 'Visualize Proof'}
          </button>

          <button
            className={`validate-button ${validationStatus === 'success' ? 'success' : ''}`}
            onClick={handleValidate}
            disabled={!graphData || validationStatus === 'loading' || isLoading} 
          >
            {/* Dynamically change button text based on validation state */}
            {validationStatus === 'idle' && 'Validate Logic'}
            {validationStatus === 'loading' && 'Validating...'}
            {validationStatus === 'success' && 'Proof is Valid! ✔'}
          </button>
        </div>

        {/* --- Error Display --- */}
        {/* Conditionally render the error message if it exists */}
        {error && <p style={{color: 'red', marginTop: '15px'}}>{error}</p>}
        
        {/* --- Visualization Area --- */}
        {/* Conditionally render the graph and concepts window ONLY if graphData exists */}
        {graphData && (
          <div className="viz-container">
            <GraphDisplay 
              graphData={graphData} 
            />
            {/* Conditionally render the concepts window ONLY if concepts were returned */}
            {graphData.key_concepts && <ConceptsWindow concepts={graphData.key_concepts} />}
          </div>
        )}

      </header>
    </div>
  );
}

export default App;