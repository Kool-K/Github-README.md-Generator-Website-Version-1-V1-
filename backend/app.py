# backend/app.py

import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from backend/.env
load_dotenv(dotenv_path="backend/.env")

# Configure the Gemini API client
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    # You might want to handle this more gracefully
    # For now, we'll let it raise an error if the key is missing/invalid

app = FastAPI()

# Setup CORS middleware to allow your frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ReadmeRequest(BaseModel):
    repo_url: str
    # This is a great improvement we'll discuss below!
    repo_structure: str | None = None
    existing_readme: str | None = None

@app.post("/generate-readme")
async def generate_readme(data: ReadmeRequest):
    # Suggesting a slightly more powerful and descriptive model that's still in the free tier
    model = genai.GenerativeModel('gemini-1.5-flash-latest')

    # Constructing a more detailed prompt for better results
    prompt = (
        "You are an expert software developer and technical writer. Your task is to generate a detailed, professional, and well-structured README.md file for a GitHub repository. "
        "The README should be clear, concise, and provide all necessary information for a new user or contributor.\n\n"
    )

    if data.repo_url:
        prompt += f"**Repository URL:**\n`{data.repo_url}`\n\n"

    # This is the key improvement! Using the repository structure for context.
    if data.repo_structure:
        prompt += f"**Repository Structure:**\n```\n{data.repo_structure}\n```\n\n"

    if data.existing_readme:
        prompt += (
            f"**Existing README Content:**\n---\n{data.existing_readme}\n---\n\n"
            "Please improve the existing README. Make it more detailed, better organized, and more professional. Fill in any missing sections like Installation, Usage, etc., based on the repository structure."
        )
    else:
        prompt += (
            "No existing README was found. Create a comprehensive README from scratch. "
            "Based on the repository structure and common practices, please include sections like: \n"
            "- Project Title\n"
            "- Description\n"
            "- Features\n"
            "- Tech Stack\n"
            "- Installation Guide\n"
            "- How to Run\n"
            "- License\n"
        )
    
    prompt += "\n\n**Output:**\nPlease provide the complete README content in Markdown format."

    try:
        # Generate content using the Gemini API
        response = model.generate_content(prompt)
        
        # Access the generated text
        generated_readme = response.text.strip()
        
        return {"readme": generated_readme}

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred with the Gemini API: {str(e)}")

# To run the app, navigate to your project root in the terminal and run:
# uvicorn backend.app:app --reload