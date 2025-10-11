/**
 * @file App.js
 * @project ProofViz
 * @author Sergio Maximiliano Haro
 * @date October 3, 2025
 *
 * @description
 * This is the main React component for the ProofViz application. It manages the
 * user interface, including the text input and button, handles state for the
 * proof text and graph data, and orchestrates the API call to the backend.
 */

import './App.css';
import React, { useState } from 'react';
import axios from 'axios';
import GraphDisplay from './GraphDisplay';

function App() {
  const [proofText, setProofText] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setGraphData(null); // Clear previous graph
    
    try {
      const response = await axios.post('http://localhost:5000/process-proof', {
        proof: proofText
      });
      setGraphData(response.data);
    } catch (err) {
      console.error("Error fetching data from backend:", err);
      setError("Failed to generate visualization. Please check the proof or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ProofViz 🔬</h1>
        <p>Paste your LaTeX mathematical proof below to visualize its logical structure.</p>
        <textarea
          className="proof-textarea"
          value={proofText}
          onChange={e => setProofText(e.target.value)}
          placeholder="e.g., Assume for the sake of contradiction that $\sqrt{2}$ is rational..."
        />
        <button 
          className="submit-button" 
          onClick={handleSubmit} 
          disabled={isLoading}
        >
          {isLoading ? 'Visualizing...' : 'Visualize Proof'}
        </button>

        {error && <p style={{color: 'red', marginTop: '15px'}}>{error}</p>}
        
        
        {graphData && <GraphDisplay graphData={graphData} />}

      </header>
    </div>
  );
}

export default App;