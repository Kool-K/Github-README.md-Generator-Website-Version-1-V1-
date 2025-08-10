# 📛 AI-Powered README Generator

> Tired of manually writing READMEs? Struggling to find the right prompts for Copilot?
>
> **No worries. This tool is for you. 😉**

## 📜 Description

This project is a web-based application designed to automatically generate professional `README.md` files for any public GitHub repository. It features a Python/FastAPI backend that leverages the Google Gemini API for content generation and a clean, interactive vanilla HTML, CSS, and JavaScript frontend. The application analyzes a repository's file structure and the content of key files to produce a detailed, accurate, and well-structured README.

## ✨ Features

* **Dynamic Repo Analysis:** Fetches and displays the complete file structure of any public GitHub repository, correctly identifying the default branch (`main`, `master`, `beta`, etc.).
* **Intelligent Content Parsing:** Reads the content of key files (like `requirements.txt`, `app.py`, `package.json`) to accurately determine the tech stack and project purpose.
* **AI-Powered Generation:** Uses the Google Gemini API to generate a comprehensive README from scratch, complete with emojis and a professional structure.
* **Existing README Improvement:** Can load a repository's existing README (case-insensitively) and use it as context for the AI to improve upon.
* **Interactive UI:** A clean, single-page interface to input a URL, view the repository structure, and see the generated README in real-time with loading states.
* **Client-Side Tools:** Includes "Edit," "Copy," and "Download" functionality for the generated README content directly in the browser.

## 🛠️ Tech Stack

* **Backend:**
    * Python 3
    * FastAPI (for the web server)
    * Uvicorn (as the ASGI server)
* **Frontend:**
    * HTML5
    * CSS3
    * Vanilla JavaScript
* **AI & APIs:**
    * Google Gemini API (`gemini-1.5-flash-latest`)
    * GitHub API (for repository data)

## 📂 Repository Structure

<details>
<summary>Click to view the repository structure</summary>
.
├── .gitignore
├── backend/
│   ├── .env
│   ├── pycache/
│   ├── app.py
│   └── requirements.txt
├── index.html
├── script.js
├── styles.css
└── venv/
</details>

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Python 3.8+
* Git
* A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```
2.  **Create and activate a Python virtual environment:**
    * On macOS/Linux:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    * On Windows:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
3.  **Install the required packages:**
    ```bash
    pip install -r backend/requirements.txt
    ```
4.  **Create your environment file:**
    Create a new file named `.env` inside the `backend` folder.
5.  **Add your API Key:**
    Open the `.env` file and add your Google Gemini API key like this:
    ```ini
    GOOGLE_API_KEY=AIzaSy...your...key...here
    ```

### ▶️ How to Run

1.  **Start the backend server:**
    From the **root directory** of the project (not the `backend` directory), run the following command:
    ```bash
    uvicorn backend.app:app --reload
    ```
2.  **Open the application:**
    Open the `index.html` file in your favorite web browser.

You can now paste a GitHub repository URL and start generating READMEs!

## 📄 License

Distributed under the MIT License.