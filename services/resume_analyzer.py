"""
AI Resume Analysis and Skill Gap Detection Service
Leverages Google GenAI (Gemini) SDK to extract skills, calculate role compatibility,
detect critical skill gaps, and generate actionable 30-60-90 day learning roadmaps.
"""

import os
import json
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

def get_genai_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def analyze_resume_skill_gaps(
    resume_text: str,
    target_role: str = "Full Stack Engineer",
    job_description: Optional[str] = None,
    model_name: str = "gemini-3.8-flash"
) -> Dict[str, Any]:
    """
    Analyzes resume against target role or custom job description.
    Returns structured scores, matched skills, missing skills, ATS feedback,
    learning roadmap, and targeted interview prep questions.
    """
    client = get_genai_client()
    
    jd_context = job_description if job_description and job_description.strip() else f"Standard industry requirements for {target_role}"
    
    prompt = f"""
You are an expert AI Technical Recruiter and Career Strategist.
Analyze the candidate's resume against the Target Role and Job Description to perform Skill Gap Detection.

Resume:
\"\"\"
{resume_text}
\"\"\"

Target Role: {target_role}
Job Description:
\"\"\"
{jd_context}
\"\"\"

Return a strictly valid JSON object matching this schema:
{{
  "overallMatchScore": 85,
  "technicalMatchScore": 80,
  "experienceMatchScore": 88,
  "atsScore": 90,
  "candidateLevel": "Mid-Level",
  "executiveSummary": "Summary statement...",
  "detectedStrengths": ["Strength 1", "Strength 2"],
  "matchedSkills": [
    {{"name": "Skill Name", "category": "Language/Framework/Cloud", "proficiency": "Proficient", "evidence": "Context"}}
  ],
  "missingSkills": [
    {{"name": "Missing Skill", "category": "Cloud/DevOps", "priority": "Critical", "reason": "Why needed"}}
  ],
  "atsOptimization": {{
    "score": 85,
    "missingKeywords": ["Keyword1", "Keyword2"],
    "bulletPointImprovements": [
      {{"originalSnippet": "...", "suggestedRewrite": "...", "rationale": "..."}}
    ],
    "formattingTips": ["Tip 1", "Tip 2"]
  }},
  "learningRoadmap": [
    {{"phase": "Days 1-30", "focus": "...", "keyActions": ["..."], "recommendedProject": "..."}}
  ],
  "targetedInterviewQuestions": [
    {{"question": "...", "category": "Technical", "interviewerIntent": "...", "keyPointsToHit": ["..."]}}
  ]
}}
"""

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    
    return json.loads(response.text)

if __name__ == "__main__":
    sample_resume = \"\"\"
    John Doe - Software Engineer
    Skills: Python, FastAPI, React, PostgreSQL, Docker, Git.
    Experience: 3 years building REST APIs, managing database schemas, and building responsive dashboards.
    \"\"\"
    result = analyze_resume_skill_gaps(sample_resume, "Senior Cloud Engineer")
    print(json.dumps(result, indent=2))
