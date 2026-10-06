import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  Database,
  Terminal,
  CheckCircle2,
  ListTodo,
  Download,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Code2,
  Server,
  Shield,
  Clock,
  ChevronRight,
  Lightbulb,
  ExternalLink,
  Laptop,
  CheckSquare,
  Square,
  FileCode,
  Zap,
} from 'lucide-react';
import { ThemeColors } from '../App';

export interface ProjectSpec {
  projectTitle: string;
  tagline: string;
  targetAudience: string;
  complexity: 'Simple / MVP' | 'Medium / SaaS' | 'Complex / Enterprise' | string;
  estimatedTimeline: string;
  recommendedTechStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
  };
  requirements: {
    functional: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'P0 - Must Have' | 'P1 - High' | 'P2 - Nice to Have' | string;
    }>;
    nonFunctional: Array<{
      category: 'Performance' | 'Security' | 'Scalability' | 'Compliance' | string;
      specification: string;
    }>;
    userPersonas: Array<{
      role: string;
      goals: string;
      keyPainPoint: string;
    }>;
  };
  modules: Array<{
    id: string;
    name: string;
    responsibility: string;
    keyComponents: string[];
    dependencies: string[];
  }>;
  databaseSchema: {
    type: string;
    tables: Array<{
      name: string;
      description: string;
      primaryKey: string;
      fields: Array<{
        name: string;
        type: string;
        constraints: string;
        description: string;
      }>;
      relationships: string[];
    }>;
  };
  apis: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
    endpoint: string;
    module: string;
    description: string;
    requestBodySnippet?: string;
    responseSnippet: string;
    authRequired: boolean;
  }>;
  developmentTasks: Array<{
    phase: string;
    tasks: Array<{
      id: string;
      title: string;
      module: string;
      priority: 'High' | 'Medium' | 'Low' | string;
      estimatedHours: number;
      deliverable: string;
    }>;
  }>;
}

const SAMPLE_IDEAS = [
  {
    title: 'Airbnb for Pet Care & Dog Sitters',
    desc: 'Two-sided marketplace connecting pet owners with vetted neighborhood sitters. Includes instant booking, GPS walk tracking, and in-app photo updates.',
    platform: 'Web & Mobile',
    stack: 'Next.js + Node/TypeScript + PostgreSQL + Redis',
  },
  {
    title: 'AI Code Review & Security Linter Bot',
    desc: 'GitHub App that automatically scans incoming pull requests for security vulnerabilities, memory leaks, and anti-patterns, posting inline review suggestions with suggested fixes.',
    platform: 'Web SaaS & GitHub App',
    stack: 'TypeScript + Express + PostgreSQL + OpenAI/Gemini API',
  },
  {
    title: 'Micro-SaaS Smart Invoicing & Expense OCR',
    desc: 'Lightweight invoicing tool for freelancers. Snaps photos of receipts to auto-extract line items via OCR, tracks overdue invoices, and supports one-click Stripe payments.',
    platform: 'Web SaaS',
    stack: 'React + Node.js + PostgreSQL + Stripe SDK',
  },
  {
    title: 'Real-Time Multiplayer Virtual Whiteboard',
    desc: 'Infinite canvas collaborative design tool where distributed engineering teams brainstorm system architectures and flowcharts with live cursor synchronization.',
    platform: 'Web Application',
    stack: 'React/Canvas + Node.js + WebSocket + PostgreSQL',
  },
];

interface Props {
  currentTheme: ThemeColors;
  isDarkActive: boolean;
  selectedModel: string;
  onOpenChatWithPrompt: (prompt: string) => void;
}

type StageTab = 'requirements' | 'modules' | 'database' | 'apis' | 'tasks';

export default function ProjectGenerator({
  currentTheme,
  isDarkActive,
  selectedModel,
  onOpenChatWithPrompt,
}: Props) {
  const [ideaText, setIdeaText] = useState(SAMPLE_IDEAS[0].desc);
  const [targetPlatform, setTargetPlatform] = useState(SAMPLE_IDEAS[0].platform);
  const [preferredStack, setPreferredStack] = useState(SAMPLE_IDEAS[0].stack);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectSpec, setProjectSpec] = useState<ProjectSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<StageTab>('requirements');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const handleSelectSample = (sample: typeof SAMPLE_IDEAS[0]) => {
    setIdeaText(sample.desc);
    setTargetPlatform(sample.platform);
    setPreferredStack(sample.stack);
    setProjectSpec(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!ideaText.trim()) {
      setError('Please provide an idea description.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-project-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaText,
          targetPlatform,
          preferredStack,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate project specification.');
      }

      setProjectSpec(data.projectSpec);
      setActiveStage('requirements');
      setCompletedTasks({});
    } catch (err: any) {
      setError(err?.message || 'Error occurred while contacting Gemini API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleDownloadMarkdown = () => {
    if (!projectSpec) return;

    const md = `# ${projectSpec.projectTitle} — Architecture & Project Specification
*${projectSpec.tagline}*

- **Target Platform:** ${targetPlatform}
- **Complexity:** ${projectSpec.complexity}
- **Estimated Timeline:** ${projectSpec.estimatedTimeline}
- **Generated by:** NEXORA AI Requirements-to-Project Engine

---

## 1. Executive Summary & Tech Stack
**Target Audience:** ${projectSpec.targetAudience}

### Recommended Stack
- **Frontend:** ${projectSpec.recommendedTechStack.frontend.join(', ')}
- **Backend:** ${projectSpec.recommendedTechStack.backend.join(', ')}
- **Database:** ${projectSpec.recommendedTechStack.database.join(', ')}
- **Infrastructure:** ${projectSpec.recommendedTechStack.infrastructure.join(', ')}

---

## 2. Requirements Specification

### Functional Requirements
${projectSpec.requirements.functional
  .map((f) => `- **[${f.id}] ${f.title}** (${f.priority})\n  ${f.description}`)
  .join('\n\n')}

### Non-Functional Requirements
${projectSpec.requirements.nonFunctional
  .map((nf) => `- **${nf.category}:** ${nf.specification}`)
  .join('\n')}

### User Personas
${projectSpec.requirements.userPersonas
  .map((p) => `- **${p.role}:** Goals: ${p.goals} | Pain Point: ${p.keyPainPoint}`)
  .join('\n')}

---

## 3. Modules & Architecture
${projectSpec.modules
  .map(
    (m) =>
      `### [${m.id}] ${m.name}\n- **Responsibility:** ${m.responsibility}\n- **Key Components:** ${m.keyComponents.join(', ')}\n- **Dependencies:** ${m.dependencies.join(', ')}`
  )
  .join('\n\n')}

---

## 4. Database Schema (${projectSpec.databaseSchema.type})
${projectSpec.databaseSchema.tables
  .map(
    (t) => `### Table: \`${t.name}\`
*${t.description}* | **Primary Key:** \`${t.primaryKey}\`
| Field | Type | Constraints | Description |
|---|---|---|---|
${t.fields.map((f) => `| \`${f.name}\` | \`${f.type}\` | ${f.constraints} | ${f.description} |`).join('\n')}

**Relationships:**
${t.relationships.map((r) => `- ${r}`).join('\n')}
`
  )
  .join('\n')}

---

## 5. API Endpoints
| Method | Endpoint | Module | Description | Auth |
|---|---|---|---|---|
${projectSpec.apis
  .map((a) => `| \`${a.method}\` | \`${a.endpoint}\` | ${a.module} | ${a.description} | ${a.authRequired ? '🔒 Yes' : 'Public'} |`)
  .join('\n')}

---

## 6. Development Sprints & Work Breakdown
${projectSpec.developmentTasks
  .map(
    (s) => `### ${s.phase}
${s.tasks
  .map(
    (t) => `- [ ] **[${t.id}] ${t.title}** (${t.module}) — *Est: ${t.estimatedHours}h, Priority: ${t.priority}*\n  *Deliverable:* ${t.deliverable}`
  )
  .join('\n\n')}
`
  )
  .join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectSpec.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDiscussInChat = () => {
    if (!projectSpec) return;
    const prompt = `I generated a project specification for "${projectSpec.projectTitle}" (${projectSpec.tagline}).
Stack: ${projectSpec.recommendedTechStack.frontend.join(', ')} + ${projectSpec.recommendedTechStack.backend.join(', ')} + ${projectSpec.recommendedTechStack.database.join(', ')}.
Can you help me start coding the first development task from Sprint 1: "${projectSpec.developmentTasks[0]?.tasks[0]?.title || 'Core Setup'}"?`;
    onOpenChatWithPrompt(prompt);
  };

  const totalTasksCount = projectSpec?.developmentTasks.reduce(
    (acc, phase) => acc + phase.tasks.length,
    0
  ) || 0;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${
        !isDarkActive
          ? 'bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 border-slate-200/80 shadow-md shadow-indigo-500/5'
          : `${currentTheme.cardBg} border ${currentTheme.border}`
      } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${
              !isDarkActive ? 'text-slate-900' : currentTheme.headingText
            }`}>
              AI Requirement-to-Project Generator
            </h1>
          </div>
          <p className={`text-xs sm:text-sm ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext} max-w-2xl`}>
            Describe any software idea in plain English. NEXORA AI instantly converts it into a production blueprint:
            <strong className="text-indigo-600 dark:text-indigo-400"> Requirements → Modules → Database → APIs → Development Tasks</strong>.
          </p>
        </div>

        {/* Visual Pipeline Pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium shrink-0 ${
          !isDarkActive ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
        }`}>
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-mono">End-to-End System Blueprint</span>
        </div>
      </div>

      {/* Preset Ideas Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className={!isDarkActive ? 'text-slate-700' : currentTheme.headingText}>
            💡 Quick Start Inspirations
          </span>
          <span className={`text-[11px] ${!isDarkActive ? 'text-slate-500' : currentTheme.subtext}`}>
            Click to auto-fill idea
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_IDEAS.map((item, idx) => (
            <motion.button
              key={item.title}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectSample(item)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                ideaText === item.desc
                  ? !isDarkActive
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/15'
                    : 'bg-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/20'
                  : !isDarkActive
                  ? 'bg-white/90 hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <div className={`font-semibold text-xs mb-1 ${
                  !isDarkActive ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {item.title}
                </div>
                <div className={`text-[11px] line-clamp-2 leading-relaxed ${
                  !isDarkActive ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {item.desc}
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.platform}</span>
                <span className="font-mono text-slate-400">Preset #{idx + 1}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${
        !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-sm' : `${currentTheme.cardBg} border ${currentTheme.border}`
      } space-y-4`}>
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold block ${!isDarkActive ? 'text-slate-800' : currentTheme.headingText}`}>
            Describe Your Product / Project Idea in Plain English:
          </label>
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            rows={4}
            placeholder="e.g. A peer-to-peer equipment rental platform for filmmakers and photographers with verified security deposits, calendar availability, and pickup scheduling..."
            className={`w-full p-3 sm:p-3.5 text-xs sm:text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y ${
              !isDarkActive
                ? 'bg-slate-50/60 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white'
                : 'bg-slate-900/80 border-slate-800 text-slate-100 placeholder-slate-500'
            }`}
          />
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={`text-[11px] font-medium block ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext}`}>
              Target Platform:
            </label>
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border focus:outline-none ${
                !isDarkActive
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="Web SaaS">Web SaaS (Browser-based Application)</option>
              <option value="Web & Mobile">Cross-Platform (Web & iOS/Android)</option>
              <option value="Mobile App (iOS/Android)">Mobile App (Native / React Native / Flutter)</option>
              <option value="API / Developer Service">API / CLI / Developer Service</option>
              <option value="Chrome Extension / Bot">Chrome Extension or Discord / Slack Bot</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className={`text-[11px] font-medium block ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext}`}>
              Preferred Tech Stack:
            </label>
            <select
              value={preferredStack}
              onChange={(e) => setPreferredStack(e.target.value)}
              className={`w-full p-2 text-xs rounded-xl border focus:outline-none ${
                !isDarkActive
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <option value="Next.js + Node/TypeScript + PostgreSQL + Redis">Next.js + TypeScript + PostgreSQL + Redis</option>
              <option value="React + FastAPI (Python) + PostgreSQL">React + FastAPI (Python) + PostgreSQL</option>
              <option value="React + Express.js + MongoDB">MERN Stack (React + Node + Express + MongoDB)</option>
              <option value="Flutter + Go Microservices + PostgreSQL">Flutter + Go Microservices + PostgreSQL</option>
              <option value="AI-Optimal Recommendation">Auto-Recommend Best Architecture for Idea</option>
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            !isDarkActive ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={isGenerating || !ideaText.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Architecting Project Specification...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Project Specification</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Generated Project Specification Display */}
      {projectSpec && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Project Summary Banner */}
          <div className={`p-5 rounded-2xl border ${
            !isDarkActive
              ? 'bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/20 border-slate-200/90 shadow-sm'
              : `${currentTheme.cardBg} border ${currentTheme.border}`
          } space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${
                    !isDarkActive ? 'text-slate-900' : currentTheme.headingText
                  }`}>
                    {projectSpec.projectTitle}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {projectSpec.complexity}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext} mt-1 font-medium`}>
                  {projectSpec.tagline}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadMarkdown}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isDarkActive
                      ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Export PRD as Markdown"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Export (.md)</span>
                </button>
                <button
                  onClick={handleDiscussInChat}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                  title="Open Chatbot to start coding"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start Coding in Chat</span>
                </button>
              </div>
            </div>

            {/* Tech Stack Chips & Timeline */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t ${
              !isDarkActive ? 'border-slate-200/70' : 'border-slate-800'
            } text-xs`}>
              <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Estimated Timeline
                </span>
                <span className="font-semibold">{projectSpec.estimatedTimeline}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Frontend
                </span>
                <span className="truncate block font-mono text-[11px]">{projectSpec.recommendedTechStack.frontend.join(', ')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Backend
                </span>
                <span className="truncate block font-mono text-[11px]">{projectSpec.recommendedTechStack.backend.join(', ')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                  Database
                </span>
                <span className="truncate block font-mono text-[11px]">{projectSpec.recommendedTechStack.database.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Pipeline Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'requirements', label: '1. Requirements', icon: ListTodo },
              { id: 'modules', label: '2. Modules', icon: Layers },
              { id: 'database', label: '3. Database', icon: Database },
              { id: 'apis', label: '4. APIs', icon: Terminal },
              { id: 'tasks', label: '5. Dev Tasks', icon: CheckSquare },
            ].map((stage) => {
              const Icon = stage.icon;
              const isActive = activeStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id as StageTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : !isDarkActive
                      ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stage.label}</span>
                </button>
              );
            })}
          </div>

          {/* STAGE 1: REQUIREMENTS */}
          {activeStage === 'requirements' && (
            <div className="space-y-4">
              {/* Functional Requirements */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                    <ListTodo className="w-4 h-4 text-indigo-500" />
                    Functional Requirements
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {projectSpec.requirements.functional.length} Requirements
                  </span>
                </div>

                <div className="space-y-2.5">
                  {projectSpec.requirements.functional.map((fr) => (
                    <div
                      key={fr.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        !isDarkActive
                          ? 'bg-slate-50/70 border-slate-200/70'
                          : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {fr.id}
                          </span>
                          <span className="font-semibold">{fr.title}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          fr.priority.includes('P0')
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : fr.priority.includes('P1')
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {fr.priority}
                        </span>
                      </div>
                      <p className={`${!isDarkActive ? 'text-slate-600' : currentTheme.subtext} leading-relaxed`}>
                        {fr.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Functional & Personas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Non-Functional */}
                <div className={`p-4 rounded-2xl border ${
                  !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
                } space-y-3`}>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Non-Functional & Guardrails
                  </h3>
                  <div className="space-y-2">
                    {projectSpec.requirements.nonFunctional.map((nfr, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs ${
                          !isDarkActive ? 'bg-slate-50/70 border-slate-200/70' : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          {nfr.category}
                        </span>
                        <p className={!isDarkActive ? 'text-slate-600' : currentTheme.subtext}>
                          {nfr.specification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personas */}
                <div className={`p-4 rounded-2xl border ${
                  !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
                } space-y-3`}>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                    <Laptop className="w-4 h-4 text-purple-500" />
                    User Personas
                  </h3>
                  <div className="space-y-2">
                    {projectSpec.requirements.userPersonas.map((p, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs ${
                          !isDarkActive ? 'bg-slate-50/70 border-slate-200/70' : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <span className="font-bold block mb-0.5">{p.role}</span>
                        <div className="text-[11px] space-y-0.5">
                          <p className="text-slate-600 dark:text-slate-300">
                            <strong>Goal:</strong> {p.goals}
                          </p>
                          <p className="text-rose-600 dark:text-rose-400">
                            <strong>Pain Point:</strong> {p.keyPainPoint}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: MODULES & ARCHITECTURE */}
          {activeStage === 'modules' && (
            <div className="space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                  <Layers className="w-4 h-4 text-indigo-500" />
                  System Modules & Component Responsibilities
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projectSpec.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                        !isDarkActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {mod.id}
                          </span>
                          <span className="font-bold text-xs">{mod.name}</span>
                        </div>
                        <p className={`text-[11px] ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext} leading-relaxed`}>
                          {mod.responsibility}
                        </p>

                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Key Components
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {mod.keyComponents.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-500">
                        <strong>Dependencies:</strong> {mod.dependencies.join(', ') || 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: DATABASE SCHEMA */}
          {activeStage === 'database' && (
            <div className="space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                    <Database className="w-4 h-4 text-indigo-500" />
                    Database Schema Design ({projectSpec.databaseSchema.type})
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {projectSpec.databaseSchema.tables.length} Entities
                  </span>
                </div>

                <div className="space-y-4">
                  {projectSpec.databaseSchema.tables.map((table) => (
                    <div
                      key={table.name}
                      className={`p-4 rounded-xl border text-xs space-y-3 ${
                        !isDarkActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                            `{table.name}`
                          </span>
                          <span className="text-slate-500 text-[11px]">— {table.description}</span>
                        </div>
                        <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                          PK: {table.primaryKey}
                        </span>
                      </div>

                      {/* Fields Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                              <th className="pb-1">Column</th>
                              <th className="pb-1">Data Type</th>
                              <th className="pb-1">Constraints</th>
                              <th className="pb-1">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-mono">
                            {table.fields.map((f) => (
                              <tr key={f.name} className="py-1">
                                <td className="py-1 font-semibold text-slate-800 dark:text-slate-200">{f.name}</td>
                                <td className="py-1 text-indigo-600 dark:text-indigo-400">{f.type}</td>
                                <td className="py-1 text-amber-600 dark:text-amber-400 text-[10px]">{f.constraints}</td>
                                <td className="py-1 font-sans text-slate-500 text-[10px]">{f.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {table.relationships && table.relationships.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-500">
                          <strong>Relations:</strong> {table.relationships.join(' | ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: APIS */}
          {activeStage === 'apis' && (
            <div className="space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                    <Terminal className="w-4 h-4 text-indigo-500" />
                    REST API Specifications
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {projectSpec.apis.length} Endpoints
                  </span>
                </div>

                <div className="space-y-2.5">
                  {projectSpec.apis.map((api, idx) => (
                    <div
                      key={idx}
                      className={`p-3 sm:p-4 rounded-xl border text-xs space-y-2 ${
                        !isDarkActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            api.method === 'GET'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : api.method === 'POST'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : api.method === 'PUT' || api.method === 'PATCH'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {api.method}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{api.endpoint}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-400">[{api.module}]</span>
                          {api.authRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono">
                              🔒 Auth
                            </span>
                          )}
                          <button
                            onClick={() => handleCopyText(`curl -X ${api.method} https://example.com${api.endpoint}`, `api-${idx}`)}
                            className="text-slate-400 hover:text-indigo-500 p-1"
                            title="Copy cURL snippet"
                          >
                            {copiedKey === `api-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <p className={`text-[11px] ${!isDarkActive ? 'text-slate-600' : currentTheme.subtext}`}>
                        {api.description}
                      </p>

                      {/* Request / Response JSON Snippet */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                        {api.requestBodySnippet && (
                          <div className="p-2 rounded bg-slate-950 text-slate-300 overflow-x-auto">
                            <span className="text-slate-500 block mb-0.5">// Request Body</span>
                            <code>{api.requestBodySnippet}</code>
                          </div>
                        )}
                        <div className={`p-2 rounded bg-slate-950 text-slate-300 overflow-x-auto ${!api.requestBodySnippet ? 'sm:col-span-2' : ''}`}>
                          <span className="text-slate-500 block mb-0.5">// Expected Response (200 OK)</span>
                          <code>{api.responseSnippet}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: DEVELOPMENT TASKS */}
          {activeStage === 'tasks' && (
            <div className="space-y-4">
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${!isDarkActive ? 'text-slate-900' : currentTheme.headingText}`}>
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                      Phased Development Sprints & Task Board
                    </h3>
                    <p className={`text-xs ${!isDarkActive ? 'text-slate-500' : currentTheme.subtext} mt-0.5`}>
                      Track deliverables and check off milestones as you build.
                    </p>
                  </div>

                  {/* Task Progress Tracker */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold">{completedCount} of {totalTasksCount} done</span>
                      <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {projectSpec.developmentTasks.map((phase, pIdx) => (
                    <div key={pIdx} className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {phase.phase}
                      </div>

                      <div className="space-y-2">
                        {phase.tasks.map((task) => {
                          const isDone = !!completedTasks[task.id];
                          return (
                            <div
                              key={task.id}
                              onClick={() => toggleTask(task.id)}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer ${
                                isDone
                                  ? !isDarkActive
                                    ? 'bg-emerald-50/60 border-emerald-200 opacity-75'
                                    : 'bg-emerald-950/20 border-emerald-900/60 opacity-75'
                                  : !isDarkActive
                                  ? 'bg-slate-50/80 hover:bg-slate-50 border-slate-200'
                                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
                              }`}
                            >
                              <button
                                className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0"
                                aria-label="Toggle task"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold ${isDone ? 'line-through text-slate-400' : ''}`}>
                                    [{task.id}] {task.title}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ~{task.estimatedHours}h
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                      task.priority === 'High'
                                        ? 'bg-rose-500/10 text-rose-500'
                                        : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span><strong>Module:</strong> {task.module}</span>
                                  <span>•</span>
                                  <span><strong>Deliverable:</strong> {task.deliverable}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
