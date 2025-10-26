# ProofViz 🔬

ProofViz is a full-stack web application that transforms dense LaTeX mathematical proofs into clear, interactive logical graphs. This educational tool uses an AI backend to parse the proof's structure and a React frontend to visualize the dependencies, helping students and mathematicians demystify the flow of complex arguments.

<img width="1920" height="954" alt="image" src="https://github.com/user-attachments/assets/ac3be1a4-26d5-4125-bf22-ff65c96d8810" />


---

## Features

* **AI-Powered Analysis**: Uses Google Gemini to deconstruct the logical steps of a mathematical proof.
* **Key Concepts Extraction**: Automatically identifies and lists key definitions, theorems, or axioms used to justify steps in the proof.
* **Interactive Graph Visualization**: Renders proofs as dynamic graphs where you can drag nodes, pan, and zoom.
* **LaTeX Rendering**: Uses react-latex-next to render all mathematical notations ($\sqrt{2}$, $\lim_{n \to \infty}$, etc...) beautifully inside the graph nodes.
* **Hierarchical Layout**: Automatically arranges the graph in a top-down, layer-based tree, so logical dependencies flow clearly from assumptions to conclusions.
* **Full-Stack Architecture**: Built with a modern React frontend and a robust Python/Flask backend.

---

## Tech Stack

* **Frontend**:
    * **React**: A component-based library for building user interfaces.
    * **React Flow**: A powerful library for creating node-based graphs.
    * **react-latex-next**: A lightweight library for rendering LaTeX.
    * **Axios**: For making HTTP requests to the backend API.
* **Backend**:
    * **Python**: The core language for the server and AI logic.
    * **Flask**: A lightweight web framework for building the REST API.
    * **Flask-CORS**: To handle Cross-Origin Resource Sharing.
* **AI**:
    * **Google Gemini**: The LLM used for parsing and logical analysis.

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### **Prerequisites**

Before you begin, ensure you have the following installed:
* **Node.js and npm**: Required for the React frontend. You can download it from [nodejs.org](https://nodejs.org/).
* **Python 3**: Required for the Flask backend. You can download it from [python.org](https://python.org/).
* **Google Gemini API Key**: You'll need an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Installation & Setup

### **1. Backend Server (`proofviz-backend`)**

First, set up and run the Python backend.

```bash
# 1. Navigate into the backend directory
cd proofviz-backend

# 2. Install the required Python packages
pip install Flask Flask-Cors google-generativeai python-dotenv

# 3. Create a .env file in this directory
#    Add your API key to this file:
#    GEMINI_API_KEY=YOUR_API_KEY_HERE

# 4. Run the Flask server
python app.py
```
Your backend should now be running on http://localhost:5000.

### **2. Frontend Application (`proofviz-frontend`)**

Next in a separate terminal window, set up and run the React frontend.

```bash
# 1. Navigate into the frontend directory
cd proofviz-frontend

# 2. Install the required npm packages
# The --legacy-peer-deps flag is required to resolve
# dependency conflicts with the new version of React.
npm install --legacy-peer-deps

# 3. Start the React development server
npm start
```
Your browser should automatically open to http://localhost:3000, where you can see the application running.

---
## Visualization in Action
The application renders the complete logical structure of a proof, automatically arranging it into a clean, hierarchical layout and rendering all LaTeX. It also extracts and displays key concepts used.

<img width="1832" height="950" alt="image" src="https://github.com/user-attachments/assets/c92f7c4a-9d4b-450e-85bf-ac33689f0478" />

To clarify complex arguments, you can click on any node. This interactive feature highlights its direct dependencies, making it easy to trace the logic step-by-step, especially in denser proofs with multiple connections. 

<img width="1052" height="935" alt="image" src="https://github.com/user-attachments/assets/aff7518d-37a0-491f-ac40-784ee8d5742e" />

For example if we click on N13, we see that it highlights its direct dependencies: N6, N12 and N14.

---

## How to Use
1. Ensure both the backend and frontend servers are running.

2. Open your web browser and navigate to http://localhost:3000.

3. Paste a mathematical proof written in LaTeX into the text area.

4. Click the "Visualize Proof" button.

5. An interactive, logically-structured graph and a list of key concepts will appear. Interact with the graph: Drag nodes, pan, zoom, and click nodes to highlight dependencies.

---

## Future Improvements

* **Concept Linking:** Link the key concepts displayed to the specific nodes/edges in the graph where they are applied.
* **Logical Flaw Detection:** Enhance the AI prompt to identify and highlight potential errors or missing steps in a proof.
* **Save & Share:** Add functionality for users to save and share their generated proof graphs.
