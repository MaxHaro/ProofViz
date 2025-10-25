# =============================================================================
# File: app.py
# Project: ProofViz
# Author: Sergio Maximiliano Haro
# Date: October 3, 2025
#
# Description:
#   This file contains the main Flask application for the ProofViz backend.
#   It defines the API endpoint that receives a LaTeX proof, communicates
#   with the Google Gemini API, and returns a structured JSON graph.
# =============================================================================

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Load environment variables from the .env file
load_dotenv()
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    print("ERROR: GEMINI_API_KEY not found in environment variables.")
    exit()

@app.route('/process-proof', methods=['POST']) 

def process_proof_endpoint():
    # Get the JSON data sent from the frontend
    data = request.get_json()
    if not data or 'proof' not in data: 
        # Return an error response if the request is badly formatted
        return jsonify({"error": "Invalid request: 'proof' key is missing."}), 400

    latex_proof = data['proof']

    prompt = f"""
    You are a specialized AI assistant for mathematical logic and visualization.
    Your task is to deconstruct a mathematical proof written in LaTeX into a directed acyclic graph (DAG).
    Represent this graph in a JSON format with two main keys: "nodes" and "edges".

    1.  **Nodes**: Each node must have a unique `id`, a `label`, and a `type`.
        * **id**: This MUST be a string in the format "N1", "N2", "N3", etc., incrementing for each logical step.
        * **label**: This MUST be a concise summary of the logical step. **DO NOT include your own numbering** (like "(1)" or "Step 1:") in the label text, as the frontend will add it.
        * **type**: Must be one of 'assumption', 'deduction', 'contradiction', or 'conclusion'.
        * **Labeling Example**: For the first step, the JSON should be: {{"id": "N1", "label": "Assume for contradiction that $\sqrt{2}$ is rational.", "type": "assumption"}}

    2.  **Edges**: Each edge must have a `source` (the "id" of the starting node, e.g., "N1") and a `target` (the "id" of the ending node, e.g., "N2").

    Here is the proof you need to analyze:

    --- PROOF START ---
    {latex_proof}
    --- PROOF END ---

    Please provide ONLY the JSON object representing this proof's logical structure. Do not include any other text or explanations.
    """

    try:
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        response = model.generate_content(prompt)
        
        # Clean up the response text in case it's wrapped in markdown
        ai_response_text = response.text.strip()
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:-4].strip()

        # Convert the JSON string into a Python dictionary
        graph_data = json.loads(ai_response_text)
        
        # Send the structured data back to the frontend
        return jsonify(graph_data)

    except json.JSONDecodeError:
        # Handle cases where the AI gives us a malformed JSON string
        return jsonify({"error": "Failed to parse AI response as JSON."}), 500
    except Exception as e:
        # Handle other potential errors like API failures
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    # Starts the Flask development server on [http://127.0.0.1:5000](http://127.0.0.1:5000)
    app.run(debug=True)