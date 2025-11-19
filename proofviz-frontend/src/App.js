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
import React, { useState, useCallback } from 'react';
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
   * @state {Set<string>} highlightedNodes - Stores the IDs of nodes to be highlighted.
   * This state is "lifted" to App.js so it can be shared between GraphDisplay
   * (for clicking nodes) and ConceptsWindow (for clicking concepts).
   */
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());

  /**
   * Handles the primary "Visualize Proof" action.
   * Sends the LaTeX proof to the backend, receives the structured graph,
   * and updates the state to render the visualization.
   */
  const handleSubmit = async () => {
    setIsLoading(true);
    setValidationStatus('idle'); // Reset validation button
    setError(null);
    setGraphData(null); 
    setHighlightedNodes(new Set()); // Clear highlights on new proof
    
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

  /**
   * @callback handleNodeClick
   * @description Called by GraphDisplay when a node is clicked.
   * Calculates and sets the highlighted nodes (the node and its direct neighbors).
   * @param {string} nodeId - The ID of the clicked node.
   */
  const handleNodeClick = useCallback((nodeId) => {
    if (!graphData) return;

    setHighlightedNodes(prevSelected => {
      // If the clicked node is already the only one highlighted, clear highlights
      if (prevSelected.size === 1 && prevSelected.has(nodeId)) {
        return new Set();
      }

      // Find all neighbors
      const neighbors = new Set([nodeId]); // Start with the node itself
      graphData.edges.forEach(edge => {
        if (edge.source === nodeId) neighbors.add(edge.target);
        if (edge.target === nodeId) neighbors.add(edge.source);
      });
      return neighbors;
    });
  }, [graphData]); // Re-create this function if graphData changes

  /**
   * @callback handleConceptClick
   * @description Called by ConceptsWindow when a concept is clicked.
   * Sets the highlighted nodes to the list provided by the concept.
   * @param {Array<string>} nodeIds - An array of node IDs to highlight.
   */
  const handleConceptClick = useCallback((nodeIds) => {
    if (!nodeIds || nodeIds.length === 0) {
      setHighlightedNodes(new Set()); // If concept links to nothing, clear
      return;
    }
    // Highlight all nodes specified by the 'used_in_nodes' array
    setHighlightedNodes(new Set(nodeIds));
  }, []);

  /**
   * @callback handlePaneClick
   * @description Called by GraphDisplay when the graph background is clicked.
   * Clears all highlighting.
   */
  const handlePaneClick = useCallback(() => {
    setHighlightedNodes(new Set());
  }, []);


  /**
   * Manually adds a new node to the graph.
   * Prompts the user for the label text (supporting LaTeX) and updates graphData.
   */
  const handleAddNode = () => {
    // Check if a graph exists
    if (!graphData) return;

    // Prompt user for text
    const label = prompt("Enter text for new step (wrap math in $...$):");
    if (!label) return; // Exit if user cancelled

    // Create a unique ID
    const newId = prompt("Enter node ID for your new step (e.g. N1, N7, Explanation, etc.):");
    if (!newId) return;

    // Create the new node object
    const newNode = {
      id: newId,
      label: label, // The MathNode component will automatically render LaTeX here
      type: 'deduction',
      // isValid will default to true in MathNode
      // critique will default to "" in MathNode
    };

    // Update the state
    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode] // Append the new node
    }));
  };

  // --- Render the main component --- 
  return (
    <div className="App">
      <header className="App-header">
        <h1>ProofViz 🔬</h1>
        <div className="instructions-box">
          <h4>How to Use ProofViz:</h4>
          <ul>
            <li>
              <strong>Visualize:</strong> Paste your LaTeX proof and click "Visualize Proof" to see the graph and key concepts.
            </li>
            <li>
              <strong>Validate Proof:</strong> Click "Validate Logic" to have the AI check the proof. Flawed steps will be marked in red (⚠️). Hover over the flawed node to read the logical discrepancy. 
            </li>
            <li>
              <strong>Explore Graph:</strong> Drag nodes wherever you like and click any node in the graph to highlight its direct dependencies. Click the background to clear. 
            </li>
            <li>
              <strong>Explore Key Concepts:</strong> Click any item in the "Key Concepts" window to highlight all the steps in the graph where that concept is used.
            </li>
            <li>
              <strong>Edit Graph:</strong> Add new nodes/steps by pressing the "+ Add Step" button. You may also connect any two nodes by drawing an edge between them. Delete nodes/edges by selecting them and pressing the 'Backspace' key on your keyboard.
            </li>
          </ul>
        </div>

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
            className="action-button"
            onClick={handleAddNode}
            disabled={!graphData || isLoading}
          >
            + Add Step
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
            {/* Pass down the graph data and all state/handlers
              needed for interaction (highlighting, clicks).
            */}
            <GraphDisplay 
              graphData={graphData}
              highlightedNodes={highlightedNodes}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
            />
            
            {/* Conditionally render the concepts window */}
            {graphData.key_concepts && (
              <ConceptsWindow 
                concepts={graphData.key_concepts}
                onConceptClick={handleConceptClick}
              />
            )}
          </div>
        )}

      </header>
    </div>
  );
}

export default App;