import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Brain,
  Download,
  MessageSquare,
  RefreshCw,
  Award,
  Layers,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Briefcase,
  Zap,
} from 'lucide-react';
import { ThemeColors } from '../App';

export interface ResumeAnalysisResult {
  overallMatchScore: number;
  technicalMatchScore: number;
  experienceMatchScore: number;
  atsScore: number;
  candidateLevel: string;
  executiveSummary: string;
  detectedStrengths: string[];
  matchedSkills: Array<{
    name: string;
    category: string;
    proficiency: string;
    evidence: string;
  }>;
  missingSkills: Array<{
    name: string;
    category: string;
    priority: 'Critical' | 'Recommended' | 'Optional';
    reason: string;
  }>;
  atsOptimization: {
    score: number;
    missingKeywords: string[];
    bulletPointImprovements: Array<{
      originalSnippet: string;
      suggestedRewrite: string;
      rationale: string;
    }>;
    formattingTips: string[];
  };
  learningRoadmap: Array<{
    phase: string;
    focus: string;
    keyActions: string[];
    recommendedProject: string;
  }>;
  targetedInterviewQuestions: Array<{
    question: string;
    category: string;
    interviewerIntent: string;
    keyPointsToHit: string[];
  }>;
}

const SAMPLE_RESUMES: Record<string, { label: string; text: string; role: string; jd: string }> = {
  fullstack: {
    label: 'Full Stack Engineer (3 YOE)',
    role: 'Senior Full Stack Engineer',
    text: `ALEX RIVERA
Full Stack Software Engineer | alex.rivera@example.com | San Francisco, CA

SUMMARY
Results-oriented software engineer with 3+ years of experience designing and developing web applications. Skilled in React, Node.js, TypeScript, and relational databases. Passionate about performant user interfaces and modular microservices.

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, Python, HTML5, CSS3/Tailwind
- Frameworks: React, Next.js, Express.js, Node.js
- Databases: PostgreSQL, SQLite, Redis
- Tools: Git, Docker, Jest, REST APIs, Webpack, Vite

EXPERIENCE
Software Engineer | Nexus Digital | 2022 – Present
- Built customer-facing dashboard features using React and TypeScript, improving user retention by 14%.
- Developed Express.js backend services serving 150,000+ monthly active requests with sub-100ms response latency.
- Refactored PostgreSQL queries and implemented Redis caching, reducing DB CPU load by 28%.
- Integrated third-party OAuth and Stripe payment webhooks with end-to-end unit testing in Jest.

Junior Web Developer | CloudCraft Labs | 2021 – 2022
- Developed responsive landing pages and reusable component libraries using React and Tailwind CSS.
- Automated API mock data workflows for frontend integration testing.

EDUCATION
B.S. in Computer Science | California State University, 2021`,
    jd: `Role: Senior Full Stack Engineer
Requirements:
- 4+ years of professional full-stack engineering experience.
- Deep expertise in TypeScript, React, Node.js, and modern distributed systems.
- Proven experience with Cloud Infrastructure (AWS or GCP: ECS, Lambda, S3, CloudFront).
- Strong hands-on competence with Kubernetes, Docker container orchestration, and CI/CD pipelines (GitHub Actions).
- Experience with GraphQL, Microservices, and Event-Driven Architecture (Kafka or RabbitMQ).
- Track record of leading architecture decisions and mentoring junior teammates.`,
  },
  ml_data: {
    label: 'Data Scientist & ML Developer',
    role: 'Machine Learning Engineer',
    text: `PRIYA SHARMA
Machine Learning Developer | priya.sharma@example.com | Austin, TX

SUMMARY
Data Scientist with 2.5 years of experience building predictive models, data processing pipelines, and classical machine learning solutions. Strong background in Python, statistical modeling, and data visualization.

TECHNICAL SKILLS
- Languages: Python, SQL, R
- ML & Data: Scikit-learn, Pandas, NumPy, XGBoost, Matplotlib, Seaborn
- Deep Learning: PyTorch (basics), TensorFlow (Keras)
- Tools: Jupyter, Git, Docker, PostgreSQL

EXPERIENCE
Data Scientist | Quantix Analytics | 2022 – Present
- Built customer churn prediction models utilizing XGBoost and Random Forest with 87% accuracy.
- Engineered automated data extraction and cleaning ETL scripts in Python processing 2M+ rows weekly.
- Designed interactive executive analytics dashboards in Streamlit.

EDUCATION
M.S. in Data Analytics | University of Texas at Dallas, 2022`,
    jd: `Role: Machine Learning Engineer (Production AI)
Requirements:
- 3+ years deploying ML models to high-throughput production environments.
- Deep experience with PyTorch, Transformer architectures, and LLM fine-tuning (LoRA, PEFT).
- Hands-on MLOps: MLflow, Kubeflow, Triton Inference Server, or vLLM.
- Containerized model serving using FastAPI, Docker, and Kubernetes on AWS/GCP.
- Vector databases (Pinecone, Milvus, Qdrant) and RAG architecture expertise.`,
  },
};

interface Props {
  currentTheme: ThemeColors;
  isDarkActive: boolean;
  selectedModel: string;
  onOpenChatWithPrompt: (prompt: string) => void;
}

export default function ResumeAnalyzer({
  currentTheme,
  isDarkActive,
  selectedModel,
  onOpenChatWithPrompt,
}: Props) {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUMES.fullstack.text);
  const [targetRole, setTargetRole] = useState(SAMPLE_RESUMES.fullstack.role);
  const [jobDescription, setJobDescription] = useState(SAMPLE_RESUMES.fullstack.jd);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'skills' | 'roadmap' | 'ats' | 'interview'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleLoadSample = (key: string) => {
    const s = SAMPLE_RESUMES[key];
    if (s) {
      setResumeText(s.text);
      setTargetRole(s.role);
      setJobDescription(s.jd);
      setAnalysis(null);
      setError(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!resumeText.trim()) {
      setError('Please provide or paste resume text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          targetRole,
          jobDescription,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      setAnalysis(data.analysis);
      setActiveResultTab('overview');
    } catch (err: any) {
      setError(err?.message || 'Error occurred while contacting AI model.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadReport = () => {
    if (!analysis) return;
    const reportMd = `# NEXORA AI — Resume & Skill Gap Analysis Report
**Target Role:** ${targetRole}
**Candidate Level:** ${analysis.candidateLevel}
**Generated:** ${new Date().toLocaleDateString()}

## Overall Scores
- Overall Match Score: ${analysis.overallMatchScore}%
- Technical Skills Match: ${analysis.technicalMatchScore}%
- Experience Match: ${analysis.experienceMatchScore}%
- ATS Compatibility: ${analysis.atsScore}%

## Executive Summary
${analysis.executiveSummary}

## Key Strengths
${analysis.detectedStrengths.map((s) => `- ${s}`).join('\n')}

## Critical Skill Gaps Detected
${analysis.missingSkills.map((m) => `- **${m.name}** [${m.priority}] (${m.category}): ${m.reason}`).join('\n')}

## Matched Skills Found
${analysis.matchedSkills.map((m) => `- **${m.name}** (${m.category} - ${m.proficiency}): ${m.evidence}`).join('\n')}

## 30-60-90 Day Action Roadmap
${analysis.learningRoadmap
  .map(
    (r) => `### ${r.phase}: ${r.focus}\n${r.keyActions.map((a) => `- ${a}`).join('\n')}\n*Recommended Portfolio Project:* ${r.recommendedProject}\n`
  )
  .join('\n')}

## ATS Keywords & Bullets
**Missing Keywords:** ${analysis.atsOptimization.missingKeywords.join(', ')}
${analysis.atsOptimization.bulletPointImprovements
  .map(
    (b) => `\n- **Original:** "${b.originalSnippet}"\n  **Rewritten:** "${b.suggestedRewrite}"\n  **Rationale:** ${b.rationale}`
  )
  .join('\n')}
`;

    const blob = new Blob([reportMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume-SkillGap-Analysis-${targetRole.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDiscussInChat = () => {
    if (!analysis) return;
    const prompt = `I just analyzed my resume for the "${targetRole}" role. My overall match score is ${analysis.overallMatchScore}%. My top critical skill gaps are: ${analysis.missingSkills
      .filter((s) => s.priority === 'Critical')
      .map((s) => s.name)
      .join(', ')}. Can you help me prepare a concrete study plan and give me advice on how to rewrite my resume bullets to address these gaps?`;
    onOpenChatWithPrompt(prompt);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Banner */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${
        !isDarkActive
          ? 'bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/30 border-slate-200/80 shadow-xs'
          : `${currentTheme.cardBg} border ${currentTheme.border}`
      } flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight ${currentTheme.headingText}`}>
              AI Resume Analysis & Skill Gap Detection
            </h1>
          </div>
          <p className={`text-xs sm:text-sm ${currentTheme.subtext} max-w-2xl leading-relaxed`}>
            Evaluate your technical resume against target job requirements. Detect missing competencies, ATS keyword gaps, and receive a tailored 30-60-90 day learning roadmap.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span className={`text-[11px] font-semibold ${currentTheme.subtext} mr-1`}>Samples:</span>
          {Object.entries(SAMPLE_RESUMES).map(([key, sample]) => (
            <button
              key={key}
              onClick={() => handleLoadSample(key)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs hover:border-indigo-300'
                  : `${currentTheme.secondaryBtn}`
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Resume Input */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-bold ${currentTheme.headingText} flex items-center gap-1.5`}>
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Resume Content (Paste or Edit)</span>
            </label>
            <span className={`text-[11px] ${currentTheme.subtext} font-mono`}>
              {resumeText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your plain-text resume here..."
            rows={14}
            className={`w-full p-3.5 text-xs font-mono rounded-2xl border transition-all resize-y ${
              !isDarkActive
                ? 'bg-white/90 border-slate-200/90 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 shadow-xs'
                : `${currentTheme.inputBg} border ${currentTheme.inputBorder} ${currentTheme.text} focus:border-indigo-500`
            } focus:outline-none`}
          />
        </div>

        {/* Right Column: Target Role & Job Description */}
        <div className="lg:col-span-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold ${currentTheme.headingText} flex items-center gap-1.5`}>
                <Target className="w-4 h-4 text-purple-500" />
                <span>Target Job Role</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer, ML Engineer"
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all ${
                  !isDarkActive
                    ? 'bg-white/90 border-slate-200/90 text-slate-800 placeholder-slate-400 focus:border-indigo-400 shadow-xs'
                    : `${currentTheme.inputBg} border ${currentTheme.inputBorder} ${currentTheme.text} focus:border-indigo-500`
                } focus:outline-none`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold ${currentTheme.headingText} flex items-center gap-1.5`}>
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>Job Description or Target Competencies (Optional)</span>
                </label>
                <span className={`text-[10px] ${currentTheme.subtext}`}>Leave empty to use industry standard</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or required qualifications..."
                rows={9}
                className={`w-full p-3.5 text-xs font-mono rounded-2xl border transition-all resize-y ${
                  !isDarkActive
                    ? 'bg-white/90 border-slate-200/90 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 shadow-xs'
                    : `${currentTheme.inputBg} border ${currentTheme.inputBorder} ${currentTheme.text} focus:border-indigo-500`
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !resumeText.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning competencies & detecting skill gaps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Resume & Detect Skill Gaps</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          !isDarkActive ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Analysis Results View */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pt-2"
        >
          {/* Top Score Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Overall Score */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
            } flex items-center gap-3.5`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono text-base ${
                analysis.overallMatchScore >= 75
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : analysis.overallMatchScore >= 50
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {analysis.overallMatchScore}%
              </div>
              <div>
                <div className={`text-[11px] ${currentTheme.subtext} uppercase font-bold tracking-wider`}>Overall Match</div>
                <div className={`text-sm font-bold ${currentTheme.headingText}`}>
                  {analysis.overallMatchScore >= 75 ? 'Strong Fit' : analysis.overallMatchScore >= 50 ? 'Moderate Fit' : 'Significant Gaps'}
                </div>
              </div>
            </div>

            {/* Technical Match */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
            } flex items-center gap-3.5`}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold font-mono text-base">
                {analysis.technicalMatchScore}%
              </div>
              <div>
                <div className={`text-[11px] ${currentTheme.subtext} uppercase font-bold tracking-wider`}>Technical Skills</div>
                <div className={`text-sm font-bold ${currentTheme.headingText}`}>
                  {analysis.matchedSkills.length} Verified Skills
                </div>
              </div>
            </div>

            {/* Experience Fit */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
            } flex items-center gap-3.5`}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold font-mono text-base">
                {analysis.experienceMatchScore}%
              </div>
              <div>
                <div className={`text-[11px] ${currentTheme.subtext} uppercase font-bold tracking-wider`}>Experience Level</div>
                <div className={`text-sm font-bold ${currentTheme.headingText}`}>
                  {analysis.candidateLevel}
                </div>
              </div>
            </div>

            {/* ATS Score */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
            } flex items-center gap-3.5`}>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono text-base">
                {analysis.atsScore}%
              </div>
              <div>
                <div className={`text-[11px] ${currentTheme.subtext} uppercase font-bold tracking-wider`}>ATS Readiness</div>
                <div className={`text-sm font-bold ${currentTheme.headingText}`}>
                  {analysis.atsOptimization.missingKeywords.length === 0 ? 'Optimal' : `${analysis.atsOptimization.missingKeywords.length} Keywords Missing`}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Tab Navigation */}
            <div className={`inline-flex rounded-xl p-1 border gap-1 overflow-x-auto max-w-full ${
              !isDarkActive ? 'bg-white border-slate-200 shadow-2xs' : `${currentTheme.subtleBg} border ${currentTheme.border}`
            }`}>
              <button
                onClick={() => setActiveResultTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeResultTab === 'overview'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : `${currentTheme.subtext} hover:${currentTheme.text}`
                }`}
              >
                Executive Overview
              </button>
              <button
                onClick={() => setActiveResultTab('skills')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeResultTab === 'skills'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : `${currentTheme.subtext} hover:${currentTheme.text}`
                }`}
              >
                <span>Skill Gaps ({analysis.missingSkills.length})</span>
              </button>
              <button
                onClick={() => setActiveResultTab('roadmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeResultTab === 'roadmap'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : `${currentTheme.subtext} hover:${currentTheme.text}`
                }`}
              >
                30-60-90 Roadmap
              </button>
              <button
                onClick={() => setActiveResultTab('ats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeResultTab === 'ats'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : `${currentTheme.subtext} hover:${currentTheme.text}`
                }`}
              >
                ATS Optimization
              </button>
              <button
                onClick={() => setActiveResultTab('interview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeResultTab === 'interview'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : `${currentTheme.subtext} hover:${currentTheme.text}`
                }`}
              >
                Interview Prep
              </button>
            </div>

            {/* Action Buttons: Export & Chat */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isDarkActive
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                    : currentTheme.secondaryBtn
                }`}
                title="Download full analysis as Markdown file"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export Report (.md)</span>
              </button>

              <button
                onClick={handleDiscussInChat}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                title="Transfer these findings to Chatbot for guided remediation"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss in Chat</span>
              </button>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeResultTab === 'overview' && (
            <div className="space-y-4">
              {/* Executive Summary Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-2`}>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                    Executive Evaluation
                  </h3>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${currentTheme.text}`}>
                  {analysis.executiveSummary}
                </p>
              </div>

              {/* Strengths & Immediate Gaps Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className={`p-4 sm:p-5 rounded-2xl border ${
                  !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
                } space-y-3`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      Key Proven Strengths
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.detectedStrengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className={currentTheme.text}>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Missing Skills Summary */}
                <div className={`p-4 sm:p-5 rounded-2xl border ${
                  !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
                } space-y-3`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      Primary Skill Gaps for {targetRole}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {analysis.missingSkills.slice(0, 4).map((gap, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                          gap.priority === 'Critical'
                            ? !isDarkActive
                              ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
                              : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                            : !isDarkActive
                            ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{gap.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/60 dark:bg-black/40">
                              {gap.category}
                            </span>
                          </div>
                          <div className="text-[11px] opacity-90 mt-0.5">{gap.reason}</div>
                        </div>
                        <span className="text-[10px] font-bold uppercase shrink-0 px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/40">
                          {gap.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS BREAKDOWN & GAPS */}
          {activeResultTab === 'skills' && (
            <div className="space-y-5">
              {/* Missing Skills (Skill Gaps) */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      Detected Skill Gaps ({analysis.missingSkills.length})
                    </h3>
                  </div>
                  <span className={`text-[11px] ${currentTheme.subtext}`}>Prioritized by hiring impact</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.missingSkills.map((gap, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                        gap.priority === 'Critical'
                          ? !isDarkActive
                            ? 'bg-rose-50/60 border-rose-200 text-slate-800'
                            : 'bg-rose-950/30 border-rose-800/50 text-slate-200'
                          : !isDarkActive
                          ? 'bg-amber-50/50 border-amber-200 text-slate-800'
                          : 'bg-amber-950/20 border-amber-800/40 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{gap.name}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              gap.priority === 'Critical'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {gap.priority}
                          </span>
                        </div>
                        <p className={`text-[11px] ${currentTheme.subtext} leading-relaxed`}>{gap.reason}</p>
                      </div>
                      <span className={`text-[10px] font-mono ${currentTheme.subtext} pt-1 border-t border-black/5 dark:border-white/5`}>
                        Category: {gap.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Skills Found */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      Verified Matching Skills ({analysis.matchedSkills.length})
                    </h3>
                  </div>
                  <span className={`text-[11px] ${currentTheme.subtext}`}>Extracted from resume</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {analysis.matchedSkills.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        !isDarkActive
                          ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                          : `${currentTheme.subtleBg} border ${currentTheme.border}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{m.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {m.proficiency}
                        </span>
                      </div>
                      <div className={`text-[11px] ${currentTheme.subtext} line-clamp-2`}>{m.evidence}</div>
                      <div className="text-[10px] font-mono opacity-70">{m.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 30-60-90 ROADMAP */}
          {activeResultTab === 'roadmap' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {analysis.learningRoadmap.map((rm, idx) => (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border ${
                      !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs font-mono">
                          0{idx + 1}
                        </span>
                        <div>
                          <h4 className={`font-bold text-xs sm:text-sm ${currentTheme.headingText}`}>{rm.phase}</h4>
                          <p className={`text-xs ${currentTheme.subtext}`}>{rm.focus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pl-9">
                      <div className={`text-[11px] font-bold uppercase tracking-wider ${currentTheme.subtext}`}>
                        Recommended Actions:
                      </div>
                      <ul className="space-y-1">
                        {rm.keyActions.map((act, actIdx) => (
                          <li key={actIdx} className="text-xs flex items-start gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                            <span className={currentTheme.text}>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`ml-9 p-3 rounded-xl border text-xs ${
                      !isDarkActive ? 'bg-indigo-50/60 border-indigo-200/80 text-indigo-950' : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200'
                    }`}>
                      <span className="font-bold text-[11px] block mb-0.5">Recommended Portfolio Project:</span>
                      <span>{rm.recommendedProject}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ATS OPTIMIZATION */}
          {activeResultTab === 'ats' && (
            <div className="space-y-5">
              {/* Missing ATS Keywords */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      Missing Keywords for ATS Screening
                    </h3>
                  </div>
                  <span className={`text-[11px] font-mono ${currentTheme.subtext}`}>
                    Add to relevant projects & bullet points
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.atsOptimization.missingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-medium border ${
                        !isDarkActive
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-2xs'
                          : 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50'
                      }`}
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bullet Point Rewrites (Google XYZ Formula) */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                      High-Impact Bullet Point Rewrites (XYZ Formula)
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {analysis.atsOptimization.bulletPointImprovements.map((bp, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        !isDarkActive
                          ? 'bg-slate-50/70 border-slate-200'
                          : `${currentTheme.subtleBg} border ${currentTheme.border}`
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-500 block mb-0.5">Original Snippet:</span>
                        <p className={`text-xs italic line-through opacity-70 ${currentTheme.subtext}`}>"{bp.originalSnippet}"</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                            AI Quantified Rewrite:
                          </span>
                          <button
                            onClick={() => handleCopyText(bp.suggestedRewrite, `bp_${idx}`)}
                            className="text-[11px] p-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Copy rewrite"
                          >
                            {copiedKey === `bp_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">"{bp.suggestedRewrite}"</p>
                      </div>

                      <div className={`text-[11px] ${currentTheme.subtext} pt-1 border-t border-black/5 dark:border-white/5`}>
                        <span className="font-semibold">Why this works:</span> {bp.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formatting Tips */}
              {analysis.atsOptimization.formattingTips?.length > 0 && (
                <div className={`p-4 rounded-xl border ${
                  !isDarkActive ? 'bg-white border-slate-200' : `${currentTheme.subtleBg} border ${currentTheme.border}`
                } space-y-2`}>
                  <div className={`text-xs font-bold uppercase tracking-wider ${currentTheme.headingText}`}>
                    Formatting & Parsing Recommendations
                  </div>
                  <ul className="space-y-1">
                    {analysis.atsOptimization.formattingTips.map((tip, idx) => (
                      <li key={idx} className={`text-xs flex items-start gap-2 ${currentTheme.text}`}>
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INTERVIEW PREPARATION */}
          {activeResultTab === 'interview' && (
            <div className="space-y-3">
              {analysis.targetedInterviewQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    !isDarkActive ? 'bg-white/90 border-slate-200/80 shadow-xs' : `${currentTheme.cardBg} border ${currentTheme.border}`
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                      {q.category}
                    </span>
                    <button
                      onClick={() => onOpenChatWithPrompt(`Let's do a mock interview question. The interviewer asks: "${q.question}". How should I structure my answer?`)}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Practice in Chat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className={`text-xs sm:text-sm font-bold ${currentTheme.headingText}`}>
                    Q{idx + 1}: {q.question}
                  </h4>

                  <p className={`text-[11px] ${currentTheme.subtext} italic`}>
                    <span className="font-semibold not-italic">Interviewer intent:</span> {q.interviewerIntent}
                  </p>

                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    !isDarkActive ? 'bg-slate-50/70 border-slate-200' : `${currentTheme.subtleBg} border ${currentTheme.border}`
                  }`}>
                    <span className="font-bold text-[10px] uppercase text-indigo-600 dark:text-indigo-400 block">
                      Key Points to Hit in Your Answer:
                    </span>
                    <ul className="space-y-1">
                      {q.keyPointsToHit.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5 text-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className={currentTheme.text}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
