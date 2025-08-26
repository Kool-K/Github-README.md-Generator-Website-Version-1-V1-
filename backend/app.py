
import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from backend/.env
load_dotenv(dotenv_path="backend/.env")
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

# Initialize FastAPI app
app = FastAPI()

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for a single file's content
class FileContent(BaseModel):
    path: str
    content: str

# The main request model that the frontend will send
class ReadmeRequest(BaseModel):
    repo_url: str
    repo_structure: Optional[str] = None
    existing_readme: Optional[str] = None
    file_contents: Optional[List[FileContent]] = None

# The API endpoint to generate the README
@app.post("/generate-readme")
async def generate_readme(data: ReadmeRequest):
    model = genai.GenerativeModel('gemini-1.5-flash-latest')

    prompt = f"""
**// PART 1: THE BRIEFING & INSTRUCTIONS //**

You are an expert technical writer and senior software developer with a strict focus on accuracy and formatting. Your mission is to create an exceptional README.md file.

**Core Directive:** Your primary source of truth is the content of the provided code files. Do not invent features or technologies. Analyze the code and document what is actually there.

**Tone of Voice:** Write with confidence and technical authority. Avoid all hedging language like "it seems", "likely", or "probably".

**Formatting Rule:** You MUST use the specified emoji at the beginning of every H1, H2, and H3 header. This is a strict, non-negotiable requirement.

**Section-by-Section Instructions:**
- **Project Title:** Create a concise and accurate title based on the repository's purpose.
- **Description:** Synthesize the project's primary purpose from its code.
- **Features:** Derive features *directly* from the code. Do not write placeholder text like '[Feature 1]'. Generate the actual features.
- **Tech Stack:** Rely *exclusively* on the provided dependency files to list the language and key libraries.
- **Getting Started:** Infer the exact commands and necessary software from the dependency files and common entry-point files. Provide concrete, copy-pasteable commands.
- **License:** Default to mentioning the MIT License as a placeholder.

**// PART 2: THE CLEAN TEMPLATE TO FILL //**

Based on the instructions above and the source information below, generate the complete README by filling in this exact template.

---
# 📛 Project Title

## 📜 Description

## ✨ Features

## 🛠️ Tech Stack

## 📂 Repository Structure

## 🚀 Getting Started

### Prerequisites

### ⚙️ Installation

### ▶️ How to Run

## 📄 License
---

**// PART 3: SOURCE INFORMATION FOR YOUR ANALYSIS //**

**Repository URL:** `{data.repo_url}`

**Existing README (if any, to improve upon):**
{data.existing_readme if data.existing_readme else "No existing README provided. Create one from scratch."}

**Key File Contents for Analysis:**
"""

    if data.file_contents:
        prompt += "This is your primary source of truth:\n\n"
        for file in data.file_contents:
            prompt += f"--- START OF FILE: `{file.path}` ---\n"
            prompt += f"```\n{file.content}\n```\n"
            prompt += f"--- END OF FILE: `{file.path}` ---\n\n"
    else:
        prompt += "No file contents were provided. Base your analysis on the repository URL and file structure.\n"

    # A unique placeholder for repo structure
    prompt += "\n---REPO_STRUCTURE_PLACEHOLDER---\n"

    try:
        response = model.generate_content(prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="API returned an empty response.")
        
        generated_readme = response.text.strip()
        
        if generated_readme.startswith("```markdown"):
            generated_readme = generated_readme[10:-3].strip()
        elif generated_readme.startswith("```"):
            generated_readme = generated_readme[3:-3].strip()

        structure_block = (
            f"<details>\n"
            f"<summary>Click to view the repository structure</summary>\n\n"
            f"<pre><code>{data.repo_structure}</code></pre>\n"
            f"</details>"
        )

        # Replace the placeholder with the actual repo structure block
        final_readme = generated_readme.replace("---REPO_STRUCTURE_PLACEHOLDER---", structure_block)

        return {"readme": final_readme}

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred with the Gemini API: {str(e)}")


@app.get("/health")
def health_check():
    return {"status": "ok"}