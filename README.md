# ProofViz 🔬

ProofViz is a full-stack web application that transforms dense LaTeX mathematical proofs into clear, interactive logical graphs. This educational tool uses an AI backend to parse the proof's structure and a React frontend to visualize the dependencies, helping students and mathematicians demystify the flow of complex arguments.



---

## Features

* **AI-Powered Analysis**: Uses Google Gemini to deconstruct the logical steps of a mathematical proof.
* **Interactive Graph Visualization**: Renders proofs as dynamic graphs where you can drag nodes, pan, and zoom.
* **LaTeX Support**: Accepts standard LaTeX for mathematical notation and formatting.
* **Full-Stack Architecture**: Built with a modern React frontend and a robust Python/Flask backend.

---

## Tech Stack

* **Frontend**:
    * **React**: A component-based library for building user interfaces.
    * **React Flow**: A powerful library for creating node-based graphs.
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
npm install

# 3. Start the React development server
npm start
```
Your browser should automatically open to http://localhost:3000, where you can see the application running.

---
## Final Visualization
Here is an example of the proof of irrationality of sqrt(2).

<img width="1903" height="1351" alt="Screenshot 2025-10-03 at 18-19-47 React App" src="https://github.com/user-attachments/assets/b0237eef-b3b2-4525-995e-4412e25693c4" />

And another example of the proof of the Pythagorean Theorem:

<img width="1903" height="1351" alt="Screenshot 2025-10-03 at 18-26-45 React App" src="https://github.com/user-attachments/assets/2b06fd4f-5854-48e2-9ed6-48ac7b404f48" />


---

## How to Use
1. Ensure both the backend and frontend servers are running.

2. Open your web browser and navigate to http://localhost:3000.

3. Paste a mathematical proof written in LaTeX into the text area.

4. Click the "Visualize Proof" button.

5. An interactive graph of the proof's logical structure will appear below. You can drag the nodes, pan the view with your mouse, and use the controls to zoom.

---

## Future Improvements

* **Advanced Graph Layouts:** Implement a force-directed layout algorithm for a more intuitive visual flow.
* **Logical Flaw Detection:** Enhance the AI prompt to identify and highlight potential errors or missing steps in a proof.
* **Save & Share:** Add functionality for users to save and share their generated proof graphs.
