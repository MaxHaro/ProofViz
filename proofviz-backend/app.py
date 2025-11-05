# =============================================================================
# File: app.py
# Project: ProofViz
# Author: Sergio Maximiliano Haro
# Date: October 3, 2025
#
# Description:
#   This file contains the main Flask application for the ProofViz backend.
#   It defines two API endpoints:
#   1. /process-proof: Receives LaTeX, sends it to the Gemini API, and
#      returns a JSON graph of the proof's structure and key concepts.
#   2. /validate-proof: Receives the proof and its graph, sends them to the
#      Gemini API for logical analysis, and returns a validation report.
# =============================================================================

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# =============================================================================
# PROMPT TEMPLATES
# =============================================================================

# We use .format() later to insert the dynamic proof text.
# Using 'r' (raw string) to handle backslashes in LaTeX properly.
GRAPH_GENERATION_PROMPT_TEMPLATE = r"""
You are a specialized AI assistant for mathematical logic and visualization.
Your task is to deconstruct a mathematical proof written in LaTeX into a directed acyclic graph (DAG) and identify the key definitions, theorems, or axioms used to justify the steps.

Represent your output as a single JSON object. This object MUST have three main keys: "nodes", "edges", and "key_concepts". Adhere STRICTLY to the format specified below.

1.  **Nodes**: Each node must have a unique `id`, a `label`, and a `type`.
    * **id**: REQUIRED string format "N1", "N2", "N3", etc.
    * **label**: REQUIRED concise summary. DO NOT include numbering like "(1)".
    * **type**: REQUIRED one of 'assumption', 'deduction', 'contradiction', 'conclusion'.
    * **Example Node**: {{"id": "N1", "label": "Assume for contradiction that $\sqrt{{2}}$ is rational.", "type": "assumption"}}

2.  **Edges**: Each edge must have a `source` ("id") and a `target` ("id").

3.  **key_concepts**: You MUST add this third key at the top level.
    * It must be an array of objects. Each object MUST have keys "name", "description" and "used_in_nodes".
    * Include only definitions, theorems, or axioms NECESSARY to justify a specific deduction step (an edge) in the proof.
    * **name**: The name of the theorem or definition (e.g., "Archimedean Property").
    * **description**: A brief explanation of the concept.
    * **used_in_nodes**: This MUST be an array of node IDs (e.g., ["N5", "N7"]) that are justified or defined by this concept. If the concept is general (like "Proof by Contradiction"), this array can be empty [].
    * **CRITICAL Instruction**: Within the "name" and "description" strings, ALL mathematical notation (variables, symbols, expressions, commands like `\lim`, `\sqrt`, `\in`, etc.) MUST be enclosed in $...$ delimiters for inline math.
    * **DO NOT** output raw LaTeX commands without the $...$ delimiters.
    * **Correct Delimiter Examples**:
        * `{{"name": "Definition of Even Number", "description": "An integer $n$ is even if $n = 2k$ for some integer $k$.", "used_in_nodes": ["N6", "N12"]}}`
        * `{{"name": "Archimedean Property", "description": "For any real number $x$, there exists an integer $n$ such that $n > x$.", "used_in_nodes": ["N3"]}}`
    * If no concepts are found, return an empty array `[]`.

Here is the proof you need to analyze:

--- PROOF START ---
{latex_proof}
--- PROOF END ---

Provide ONLY the JSON object. Do not include any text before or after the JSON.
"""

VALIDATION_PROMPT_TEMPLATE = r"""
You are a specialized AI assistant for mathematical logic verification.
Your task is to analyze a mathematical proof and its corresponding logical graph (in JSON) for logical soundness.

You will be given the original LaTeX proof and the JSON graph.
Your ONLY job is to analyze each node in the JSON graph. For each node, determine if its logical statement is a valid deduction based on its dependencies (the 'source' nodes pointing to it).

You MUST return ONLY a JSON object that maps each node ID to its validation status.
The format for the returned JSON object must be:
{{
  "N1": {{"isValid": true, "critique": ""}},
  "N2": {{"isValid": true, "critique": ""}},
  "N3": {{"isValid": false, "critique": "This step does not logically follow from N2. The statement $a^2 = 2b^2$ implies $a^2$ is even, not $a$ directly."}}
}}

- **isValid**: A boolean (true/false). Must be `false` if the step is a logical gap, a fallacy, or not justified.
- **critique**: A string. If `isValid` is `false`, provide a brief explanation of the flaw. If `true`, it MUST be an empty string "".
- Assumptions are almost always valid by default. Focus your critique on the 'deduction' nodes.

--- ORIGINAL PROOF TEXT ---
{latex_proof}
--- END PROOF TEXT ---

--- PROOF GRAPH JSON ---
{graph_json}
--- END PROOF GRAPH JSON ---

Provide ONLY the validation JSON object. Do not include any text or explanations.
"""

# =============================================================================
# FLASK APPLICATION SETUP
# =============================================================================

app = Flask(__name__)
# Enable CORS for all routes to allow the React frontend (on a different port)
# to make requests to this backend.
CORS(app)

# Load and configure the Gemini API Key from the .env file
load_dotenv()
try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    print("CRITICAL ERROR: GEMINI_API_KEY not found in environment variables.")
    exit(1) # Exit with an error code if the key is missing

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/process-proof', methods=['POST'])
def process_proof_endpoint():
    """
    API endpoint to process a LaTeX proof text.
    Receives: A JSON object with a "proof" key.
    Returns: A JSON object containing the 'nodes', 'edges', and 'key_concepts'
             of the proof's logical structure.
    """
    data = request.get_json()

    # --- 1. Input Validation ---
    if not data or 'proof' not in data:
        # Return a 400 Bad Request if the expected JSON key is missing
        return jsonify({"error": "Invalid request: 'proof' key is missing."}), 400

    latex_proof = data['proof']

    # --- 2. Prompt Generation ---
    # Format the prompt template with the user-provided proof
    prompt = GRAPH_GENERATION_PROMPT_TEMPLATE.format(latex_proof=latex_proof)

    # --- 3. AI Call & Response Handling ---
    try:
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        response = model.generate_content(prompt)
        
        # Clean up the response text (removes markdown fences like ```json ... ```)
        ai_response_text = response.text.strip()
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:-4].strip()

        # Parse the JSON string into a Python dictionary
        graph_data = json.loads(ai_response_text)
        
        # Send the structured data back to the frontend
        return jsonify(graph_data)

    except json.JSONDecodeError:
        # Handle cases where the AI's output is not valid JSON
        return jsonify({"error": "Failed to parse AI response as JSON."}), 500
    except Exception as e:
        # Handle all other errors (e.g., API failures, timeouts)
        print(f"An unexpected error occurred in /process-proof: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/validate-proof', methods=['POST'])
def validate_proof_endpoint():
    """
    API endpoint to validate the logical soundness of a proof graph.
    Receives: A JSON object with "proof" (string) and "graphData" (the graph object).
    Returns: A JSON object mapping node IDs to their validation status
             (e.g., {"N1": {"isValid": true, "critique": ""}, ...}).
    """
    data = request.get_json()

    # --- 1. Input Validation ---
    if not data or 'proof' not in data or 'graphData' not in data:
        return jsonify({"error": "Invalid request: 'proof' or 'graphData' key is missing."}), 400

    latex_proof = data['proof']
    # Convert the received graphData dict back into a JSON string for the prompt
    graph_json = json.dumps(data['graphData'], indent=2)

    # --- 2. Prompt Generation ---
    # Format the validation prompt with the proof and the graph
    prompt = VALIDATION_PROMPT_TEMPLATE.format(latex_proof=latex_proof, graph_json=graph_json)

    # --- 3. AI Call & Response Handling ---
    try:
        model = genai.GenerativeModel('models/gemini-2.5-pro')
        response = model.generate_content(prompt)
        
        # Clean up the response text
        ai_response_text = response.text.strip()
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:-4].strip()

        # Parse the JSON string into a Python dictionary
        validation_data = json.loads(ai_response_text)
        
        # Send the structured validation data back to the frontend
        return jsonify(validation_data)

    except json.JSONDecodeError:
        # Handle cases where the AI's output is not valid JSON
        return jsonify({"error": "Failed to parse AI validation response as JSON."}), 500
    except Exception as e:
        # Handle all other errors
        print(f"An unexpected error occurred during validation: {e}")
        return jsonify({"error": "An internal server error occurred during validation."}), 500

# =============================================================================
# MAIN EXECUTION
# =============================================================================

if __name__ == '__main__':
    # Starts the Flask development server
    # debug=True enables auto-reloading when code changes are saved.
    app.run(debug=True, port=5000)