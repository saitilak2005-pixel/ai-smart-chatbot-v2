import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI with recommended telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models for automatic failover
const DEFAULT_MODEL = 'gemini-flash-lite-latest';
const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
];

// Health and Status API
app.get('/api/status', (req: Request, res: Response) => {
  const isKeyConfigured = Boolean(apiKey && apiKey.trim() && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'online',
    isKeyConfigured,
    defaultModel: DEFAULT_MODEL,
    availableModels: FALLBACK_MODELS,
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Conversational Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      history = [],
      message = '',
      systemPrompt = '',
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxHistoryTurns = 10,
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, error: 'User message cannot be empty' });
      return;
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(401).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in environment or .env file',
        response: '⚠️ **API Key Missing**: Please set `GEMINI_API_KEY` in `.env` to enable the chatbot.',
      });
      return;
    }

    // Format multi-turn conversation history for Gemini:
    // [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const relevantHistory = maxHistoryTurns > 0 ? history.slice(-(maxHistoryTurns * 2)) : history;
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const item of relevantHistory) {
      const role = item.role === 'user' ? 'user' : 'model';
      const text = item.content?.trim();
      if (text) {
        contents.push({ role, parts: [{ text }] });
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];
    let lastErr: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: contents as any,
          config: {
            temperature: Math.max(0, Math.min(temperature, 1)),
            systemInstruction: systemPrompt?.trim() || undefined,
            topP: 0.95,
          },
        });

        const replyText = response.text || '';
        res.json({
          success: true,
          response: replyText,
          model: targetModel,
          timestamp: new Date().toISOString(),
        });
        return;
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || String(err);
        // If high demand (503/429), try next fallback
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429')) {
          continue;
        }
        break;
      }
    }

    const errMessage = lastErr?.message || 'Unable to generate response from model';
    res.status(500).json({
      success: false,
      error: errMessage,
      response: `⚠️ **API Error**: ${errMessage}`,
    });
  } catch (globalErr: any) {
    res.status(500).json({
      success: false,
      error: globalErr?.message || 'Internal server error',
    });
  }
});

// AI Resume Analysis & Skill Gap Detection API
app.post('/api/analyze-resume', async (req: Request, res: Response) => {
  try {
    const {
      resumeText = '',
      targetRole = 'Full Stack Software Engineer',
      jobDescription = '',
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      res.status(400).json({ success: false, error: 'Resume text is required for analysis' });
      return;
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(401).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
      });
      return;
    }

    const jdContext = jobDescription?.trim()
      ? jobDescription.trim()
      : `Standard modern industry requirements and competencies for a ${targetRole}`;

    const prompt = `
You are an expert Principal Technical Recruiter, Engineering Hiring Manager, and ATS Optimization Specialist.
Perform an in-depth, rigorous, and constructive Skill Gap Detection and Resume Analysis.

Candidate Resume:
"""
${resumeText.trim()}
"""

Target Role:
${targetRole}

Target Job Description / Industry Competencies:
"""
${jdContext}
"""

Evaluate the candidate's alignment, detect critical vs recommended skill gaps, and provide an actionable career roadmap.
Return your response STRICTLY as a valid JSON object matching this exact schema:
{
  "overallMatchScore": 82,
  "technicalMatchScore": 78,
  "experienceMatchScore": 85,
  "atsScore": 80,
  "candidateLevel": "Mid-Level",
  "executiveSummary": "2-3 concise, high-impact sentences assessing fit and readiness.",
  "detectedStrengths": [
    "3 to 5 notable candidate strengths, standout skills, or proven achievements"
  ],
  "matchedSkills": [
    {
      "name": "Skill name",
      "category": "Languages | Frameworks | Cloud & DevOps | Databases | System Architecture | Soft Skills",
      "proficiency": "Expert | Proficient | Familiar",
      "evidence": "Brief context where demonstrated in resume"
    }
  ],
  "missingSkills": [
    {
      "name": "Skill name",
      "category": "Languages | Frameworks | Cloud & DevOps | Databases | System Architecture | Methodologies",
      "priority": "Critical | Recommended | Optional",
      "reason": "Why this skill is required or expected for the role"
    }
  ],
  "atsOptimization": {
    "score": 85,
    "missingKeywords": ["keyword1", "keyword2", "keyword3"],
    "bulletPointImprovements": [
      {
        "originalSnippet": "Exact phrase from resume",
        "suggestedRewrite": "Action-verb + quantifiable metric rewrite following Google XYZ formula",
        "rationale": "Why this rewrite stands out to recruiters"
      }
    ],
    "formattingTips": [
      "Actionable tip for ATS parsing and human readability"
    ]
  },
  "learningRoadmap": [
    {
      "phase": "Days 1-30: Core Gap Remediation",
      "focus": "Immediate high-priority gap to bridge",
      "keyActions": [
        "Action step 1",
        "Action step 2"
      ],
      "recommendedProject": "Tangible portfolio project demonstrating this skill"
    },
    {
      "phase": "Days 31-60: Architectural Depth",
      "focus": "System design and production practices",
      "keyActions": [
        "Action step 1",
        "Action step 2"
      ],
      "recommendedProject": "End-to-end deployed milestone"
    },
    {
      "phase": "Days 61-90: Interview Polish & Mastery",
      "focus": "Live coding, behavioral STAR stories, and system architecture",
      "keyActions": [
        "Action step 1",
        "Action step 2"
      ],
      "recommendedProject": "Open-source contribution or enterprise demo"
    }
  ],
  "targetedInterviewQuestions": [
    {
      "question": "Realistic interview question testing their experience or addressing a gap",
      "category": "System Design | Technical Coding | Architecture | Behavioral",
      "interviewerIntent": "What the interviewer is evaluating",
      "keyPointsToHit": [
        "Key concept to mention",
        "Best practice or metric to highlight"
      ]
    }
  ]
}

Output must be raw JSON with no trailing text.`;

    const modelsToTry = [model, 'gemini-3.8-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];
    let lastErr: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const rawText = response.text || '{}';
        // Clean markdown backticks if any
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        res.json({
          success: true,
          analysis: parsed,
          model: targetModel,
          timestamp: new Date().toISOString(),
        });
        return;
      } catch (err: any) {
        lastErr = err;
        continue;
      }
    }

    res.status(500).json({
      success: false,
      error: lastErr?.message || 'Failed to complete resume analysis',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Server error during resume analysis',
    });
  }
});

// AI Requirement-to-Project Generator: Idea -> Requirements -> Modules -> Database -> APIs -> Tasks
app.post('/api/generate-project-spec', async (req: Request, res: Response) => {
  try {
    const {
      idea = '',
      targetPlatform = 'Web SaaS',
      preferredStack = 'Full-Stack (React/Next.js + Node/TypeScript + PostgreSQL)',
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      res.status(400).json({ success: false, error: 'Product idea description is required.' });
      return;
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(401).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured',
      });
      return;
    }

    const prompt = `
You are a Staff Software Architect, Principal Systems Engineer, and Product Strategist.
A user describes a product or software idea in simple language:
"""
${idea.trim()}
"""
Target Platform Preference: ${targetPlatform}
Preferred Stack: ${preferredStack}

Convert this idea into an end-to-end engineering blueprint:
Requirements → Modules → Database → APIs → Development Tasks.

Return your response strictly as valid JSON matching this schema:
{
  "projectTitle": "Catchy, professional project name",
  "tagline": "One-line clear summary of value proposition",
  "targetAudience": "Target primary users and personas",
  "complexity": "Simple / MVP | Medium / SaaS | Complex / Enterprise",
  "estimatedTimeline": "e.g. 4-6 Weeks for MVP",
  "recommendedTechStack": {
    "frontend": ["Next.js", "React", "Tailwind CSS"],
    "backend": ["Node.js", "Express / NestJS", "TypeScript"],
    "database": ["PostgreSQL", "Redis"],
    "infrastructure": ["Docker", "Vercel / AWS ECS", "GitHub Actions"]
  },
  "requirements": {
    "functional": [
      {
        "id": "FR-1",
        "title": "Clear requirement name",
        "description": "Specific behavior, acceptance criteria, or functionality",
        "priority": "P0 - Must Have | P1 - High | P2 - Nice to Have"
      }
    ],
    "nonFunctional": [
      {
        "category": "Performance | Security | Scalability | Compliance",
        "specification": "Measurable threshold or security control"
      }
    ],
    "userPersonas": [
      {
        "role": "Persona Name/Role",
        "goals": "Core objective they want to accomplish",
        "keyPainPoint": "Friction or problem this app solves"
      }
    ]
  },
  "modules": [
    {
      "id": "MOD-1",
      "name": "Module / Service Name",
      "responsibility": "Core function of this module in the system",
      "keyComponents": ["Component A", "Component B"],
      "dependencies": ["Other module or external service"]
    }
  ],
  "databaseSchema": {
    "type": "Relational (PostgreSQL) | Document (MongoDB) | Hybrid",
    "tables": [
      {
        "name": "table_name",
        "description": "Purpose of this table/entity",
        "primaryKey": "id (UUID / SERIAL)",
        "fields": [
          {
            "name": "column_name",
            "type": "VARCHAR(255) | INTEGER | TIMESTAMP | JSONB | BOOLEAN",
            "constraints": "PRIMARY KEY | NOT NULL | UNIQUE | FOREIGN KEY",
            "description": "What this field represents"
          }
        ],
        "relationships": ["One-to-many with bookings (user_id -> users.id)"]
      }
    ]
  },
  "apis": [
    {
      "method": "GET | POST | PUT | PATCH | DELETE",
      "endpoint": "/api/v1/resource",
      "module": "Matching Module Name",
      "description": "Clear operation summary",
      "requestBodySnippet": "{ ...json example... } or null for GET",
      "responseSnippet": "{ ...json sample response... }",
      "authRequired": true
    }
  ],
  "developmentTasks": [
    {
      "phase": "Sprint 1: Foundation, Auth & Data Layer",
      "tasks": [
        {
          "id": "TASK-101",
          "title": "Specific actionable developer task",
          "module": "Module Name",
          "priority": "High | Medium | Low",
          "estimatedHours": 8,
          "deliverable": "Concrete artifact produced (e.g. Prisma migration + unit tests)"
        }
      ]
    },
    {
      "phase": "Sprint 2: Core Feature Implementation",
      "tasks": [
        {
          "id": "TASK-201",
          "title": "Specific actionable developer task",
          "module": "Module Name",
          "priority": "High | Medium | Low",
          "estimatedHours": 12,
          "deliverable": "Working UI component + integrated API hook"
        }
      ]
    },
    {
      "phase": "Sprint 3: Integration, Polish & Deployment",
      "tasks": [
        {
          "id": "TASK-301",
          "title": "Specific actionable developer task",
          "module": "Module Name",
          "priority": "High | Medium | Low",
          "estimatedHours": 6,
          "deliverable": "CI/CD pipeline passing with staging deploy"
        }
      ]
    }
  ]
}

Provide at least 4-6 functional requirements, 3-4 architectural modules, 3-4 core database tables, 4-6 primary REST APIs, and 3 phased development sprints with 2-4 tasks each.
Output must be strictly raw JSON with no Markdown backticks or commentary.`;

    const modelsToTry = [model, 'gemini-3.8-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];
    let lastErr: any = null;

    for (const targetModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        const rawText = response.text || '{}';
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        res.json({
          success: true,
          projectSpec: parsed,
          model: targetModel,
          timestamp: new Date().toISOString(),
        });
        return;
      } catch (err: any) {
        lastErr = err;
        continue;
      }
    }

    res.status(500).json({
      success: false,
      error: lastErr?.message || 'Failed to generate project specification',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Server error during project generation',
    });
  }
});

// Run Python Multi-Turn Test via python3 tests/test_multi_turn.py
app.post('/api/run-python-test', async (req: Request, res: Response) => {
  try {
    const { stdout, stderr } = await execAsync('python3 tests/test_multi_turn.py', {
      cwd: __dirname,
      timeout: 45000,
    });
    res.json({
      success: true,
      stdout: stdout,
      stderr: stderr,
    });
  } catch (err: any) {
    res.json({
      success: false,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Execution error',
    });
  }
});

// Retrieve Python project files for inspection & copying
app.get('/api/python-files', (req: Request, res: Response) => {
  const fileKeys = [
    { name: 'app.py', path: path.join(__dirname, 'app.py'), language: 'python' },
    { name: 'services/llm_service.py', path: path.join(__dirname, 'services', 'llm_service.py'), language: 'python' },
    { name: 'services/resume_analyzer.py', path: path.join(__dirname, 'services', 'resume_analyzer.py'), language: 'python' },
    { name: 'utils/prompts.py', path: path.join(__dirname, 'utils', 'prompts.py'), language: 'python' },
    { name: 'requirements.txt', path: path.join(__dirname, 'requirements.txt'), language: 'text' },
    { name: 'tests/test_multi_turn.py', path: path.join(__dirname, 'tests', 'test_multi_turn.py'), language: 'python' },
    { name: 'README.md', path: path.join(__dirname, 'README.md'), language: 'markdown' },
    { name: '.env.example', path: path.join(__dirname, '.env.example'), language: 'bash' },
  ];

  const files = fileKeys.map((f) => {
    let content = '';
    try {
      if (fs.existsSync(f.path)) {
        content = fs.readFileSync(f.path, 'utf-8');
      }
    } catch {
      content = `# Could not read ${f.name}`;
    }
    return {
      name: f.name,
      content,
      language: f.language,
    };
  });

  res.json({ files });
});

// Download entire project as clean ZIP
app.get('/api/download-zip', async (req: Request, res: Response) => {
  try {
    const zipPath = path.join(__dirname, 'AI-Smart-Chatbot.zip');
    // Build fresh ZIP of the project directory
    await execAsync('python3 -m zipfile -c AI-Smart-Chatbot.zip AI-Smart-Chatbot/', { cwd: __dirname });
    res.download(zipPath, 'AI-Smart-Chatbot.zip', (err) => {
      if (err) {
        console.error('Error sending zip:', err);
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate ZIP' });
  }
});

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
});
