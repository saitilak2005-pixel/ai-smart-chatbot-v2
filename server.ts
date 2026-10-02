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
