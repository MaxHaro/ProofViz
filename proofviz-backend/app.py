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
    Your task is to deconstruct a mathematical proof written in LaTeX into a directed acyclic graph (DAG) and identify the key definitions, theorems, or axioms used to justify the steps.

    Represent your output as a single JSON object. This object must have three main keys: "nodes", "edges", and "key_concepts".

    1.  **Nodes**: Each node must have a unique `id`, a `label`, and a `type`.
        * **id**: Must be a string "N1", "N2", "N3", etc.
        * **label**: Must be a concise summary. DO NOT include numbering like "(1)".
        * **type**: Must be 'assumption', 'deduction', 'contradiction', or 'conclusion'.
        * **Labeling Example**: {{"id": "N1", "label": "Assume for contradiction that $\sqrt{2}$ is rational.", "type": "assumption"}}

    2.  **Edges**: Each edge must have a `source` ("id") and a `target` ("id").

    3.  **key_concepts**: You must add this third key at the top level.
        * It must be an array of objects. Each object must have "name" and "description".
        * **Include only definitions, theorems, or axioms that are NECESSARY to justify a specific deduction step (an edge) in the proof.** Do not include general concepts not directly applied.
        * **For Definitions**: The "name" should be the term being defined (e.g., "Definition of Absolute Value") and the "description" should be the definition used in the proof (e.g., "$|x| = x$ if $x \ge 0$, and $|x| = -x$ if $x < 0$").
        * Any mathematical notation in "name" or "description" MUST be enclosed in $...$ delimiters.
        * If no specific concepts justify the steps, return an empty array [].

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