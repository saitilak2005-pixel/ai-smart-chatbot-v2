import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  User,
  Send,
  Trash2,
  PlusCircle,
  Download,
  Settings2,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  Copy,
  Check,
  FolderCode,
  FileCode2,
  Network,
  RefreshCw,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  MessageSquare,
  Flame,
  Menu,
  X,
  SlidersHorizontal,
  Shuffle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  History,
  Clock,
  Plus,
  Sun,
  Moon,
  Palette,
  Monitor,
  Brain,
  FileSearch,
  Lightbulb,
} from 'lucide-react';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import ProjectGenerator from './components/ProjectGenerator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  error?: boolean;
}

interface SavedSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface PythonFile {
  name: string;
  content: string;
  language: string;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export type ThemeModeSetting = 'sync' | 'single';

export interface ThemeColors {
  id: string;
  name: string;
  isDark: boolean;
  appBg: string;
  sidebarBg: string;
  headerBg: string;
  border: string;
  cardBg: string;
  subtleBg: string;
  text: string;
  headingText: string;
  subtext: string;
  inputBg: string;
  inputBorder: string;
  userBubble: string;
  botBubble: string;
  accentBtn: string;
  secondaryBtn: string;
  badge: string;
  modalBg: string;
}

const GITHUB_THEMES: Record<string, ThemeColors> = {
  'dark-default': {
    id: 'dark-default',
    name: 'Dark default',
    isDark: true,
    appBg: 'bg-[#0d1117]',
    sidebarBg: 'bg-[#161b22]',
    headerBg: 'bg-[#161b22]/90',
    border: 'border-[#30363d]',
    cardBg: 'bg-[#161b22]',
    subtleBg: 'bg-[#161b22]/70',
    text: 'text-[#f0f6fc]',
    headingText: 'text-white',
    subtext: 'text-[#8b949e]',
    inputBg: 'bg-[#0d1117]',
    inputBorder: 'border-[#30363d]',
    userBubble: 'bg-[#1f6feb] text-white shadow-sm',
    botBubble: 'bg-[#161b22] border border-[#30363d] text-[#f0f6fc]',
    accentBtn: 'bg-[#238636] hover:bg-[#2ea043] text-white',
    secondaryBtn: 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]',
    badge: 'bg-[#388bfd]/15 text-[#58a6ff] border-[#388bfd]/30',
    modalBg: 'bg-[#161b22]',
  },
  'dark-dimmed': {
    id: 'dark-dimmed',
    name: 'Dark dimmed',
    isDark: true,
    appBg: 'bg-[#22272e]',
    sidebarBg: 'bg-[#2d333b]',
    headerBg: 'bg-[#2d333b]/90',
    border: 'border-[#444c56]',
    cardBg: 'bg-[#2d333b]',
    subtleBg: 'bg-[#2d333b]/70',
    text: 'text-[#adbac7]',
    headingText: 'text-white',
    subtext: 'text-[#768390]',
    inputBg: 'bg-[#22272e]',
    inputBorder: 'border-[#444c56]',
    userBubble: 'bg-[#316dca] text-white shadow-sm',
    botBubble: 'bg-[#2d333b] border border-[#444c56] text-[#adbac7]',
    accentBtn: 'bg-[#347d39] hover:bg-[#46954a] text-white',
    secondaryBtn: 'bg-[#373e47] hover:bg-[#444c56] text-[#adbac7] border border-[#444c56]',
    badge: 'bg-[#316dca]/20 text-[#539bf5] border-[#316dca]/30',
    modalBg: 'bg-[#2d333b]',
  },
  'dark-high-contrast': {
    id: 'dark-high-contrast',
    name: 'Dark high contrast',
    isDark: true,
    appBg: 'bg-[#010409]',
    sidebarBg: 'bg-[#0a0c10]',
    headerBg: 'bg-[#0a0c10]',
    border: 'border-[#7a828e]',
    cardBg: 'bg-[#0a0c10]',
    subtleBg: 'bg-[#0a0c10]',
    text: 'text-[#ffffff]',
    headingText: 'text-white',
    subtext: 'text-[#f0f6fc]',
    inputBg: 'bg-[#010409]',
    inputBorder: 'border-2 border-[#7a828e]',
    userBubble: 'bg-[#1f6feb] text-white border-2 border-white shadow-sm',
    botBubble: 'bg-[#0a0c10] border-2 border-[#7a828e] text-white',
    accentBtn: 'bg-[#238636] text-white border border-white',
    secondaryBtn: 'bg-[#151b23] text-white border border-[#7a828e]',
    badge: 'bg-white/20 text-white border border-white',
    modalBg: 'bg-[#0a0c10]',
  },
  'dark-colorblind': {
    id: 'dark-colorblind',
    name: 'Dark Protanopia & Deuteranopia',
    isDark: true,
    appBg: 'bg-[#0d1117]',
    sidebarBg: 'bg-[#161b22]',
    headerBg: 'bg-[#161b22]/90',
    border: 'border-[#30363d]',
    cardBg: 'bg-[#161b22]',
    subtleBg: 'bg-[#161b22]/70',
    text: 'text-[#f0f6fc]',
    headingText: 'text-white',
    subtext: 'text-[#8b949e]',
    inputBg: 'bg-[#0d1117]',
    inputBorder: 'border-[#30363d]',
    userBubble: 'bg-[#1f6feb] text-white shadow-sm',
    botBubble: 'bg-[#161b22] border border-[#30363d] text-[#f0f6fc]',
    accentBtn: 'bg-[#b08800] hover:bg-[#c69900] text-black font-semibold',
    secondaryBtn: 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]',
    badge: 'bg-[#b08800]/20 text-[#d29922] border-[#b08800]/40',
    modalBg: 'bg-[#161b22]',
  },
  'dark-tritanopia': {
    id: 'dark-tritanopia',
    name: 'Dark Tritanopia',
    isDark: true,
    appBg: 'bg-[#0d1117]',
    sidebarBg: 'bg-[#161b22]',
    headerBg: 'bg-[#161b22]/90',
    border: 'border-[#30363d]',
    cardBg: 'bg-[#161b22]',
    subtleBg: 'bg-[#161b22]/70',
    text: 'text-[#f0f6fc]',
    headingText: 'text-white',
    subtext: 'text-[#8b949e]',
    inputBg: 'bg-[#0d1117]',
    inputBorder: 'border-[#30363d]',
    userBubble: 'bg-[#1f6feb] text-white shadow-sm',
    botBubble: 'bg-[#161b22] border border-[#30363d] text-[#f0f6fc]',
    accentBtn: 'bg-[#e5534b] hover:bg-[#fa7970] text-white',
    secondaryBtn: 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]',
    badge: 'bg-[#e5534b]/20 text-[#fa7970] border-[#e5534b]/40',
    modalBg: 'bg-[#161b22]',
  },
  'light-default': {
    id: 'light-default',
    name: 'Day theme (Modern Light)',
    isDark: false,
    appBg: 'bg-[#f8fafc]',
    sidebarBg: 'bg-[#f8fafc]/90',
    headerBg: 'bg-white/75',
    border: 'border-slate-200/80',
    cardBg: 'bg-white/90',
    subtleBg: 'bg-white/75',
    text: 'text-slate-800',
    headingText: 'text-slate-900',
    subtext: 'text-slate-500',
    inputBg: 'bg-white/90',
    inputBorder: 'border-slate-200/90',
    userBubble: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/15',
    botBubble: 'bg-white/90 border border-slate-200/80 text-slate-800 shadow-xs',
    accentBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25',
    secondaryBtn: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300',
    badge: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/70',
    modalBg: 'bg-white',
  },
  'light-high-contrast': {
    id: 'light-high-contrast',
    name: 'Light high contrast',
    isDark: false,
    appBg: 'bg-[#ffffff]',
    sidebarBg: 'bg-[#ffffff]',
    headerBg: 'bg-[#ffffff]',
    border: 'border-[#1f2328]',
    cardBg: 'bg-[#ffffff]',
    subtleBg: 'bg-[#ffffff]',
    text: 'text-[#000000]',
    headingText: 'text-[#000000]',
    subtext: 'text-[#24292f]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-2 border-[#1f2328]',
    userBubble: 'bg-[#0550ae] text-white border-2 border-black shadow-sm',
    botBubble: 'bg-[#ffffff] border-2 border-[#1f2328] text-black',
    accentBtn: 'bg-[#1a7f37] text-white border border-black',
    secondaryBtn: 'bg-[#ffffff] text-black border-2 border-black hover:bg-slate-100',
    badge: 'bg-black/10 text-black border border-black',
    modalBg: 'bg-[#ffffff]',
  },
  'light-colorblind': {
    id: 'light-colorblind',
    name: 'Light Protanopia & Deuteranopia',
    isDark: false,
    appBg: 'bg-[#ffffff]',
    sidebarBg: 'bg-[#f6f8fa]',
    headerBg: 'bg-[#ffffff]',
    border: 'border-[#d0d7de]',
    cardBg: 'bg-[#ffffff]',
    subtleBg: 'bg-[#f6f8fa]',
    text: 'text-[#1f2328]',
    headingText: 'text-[#1f2328]',
    subtext: 'text-[#656d76]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#d0d7de]',
    userBubble: 'bg-[#0969da] text-white shadow-sm',
    botBubble: 'bg-[#f6f8fa] border border-[#d0d7de] text-[#1f2328]',
    accentBtn: 'bg-[#9a6700] hover:bg-[#825600] text-white shadow-sm',
    secondaryBtn: 'bg-[#ffffff] hover:bg-[#f3f4f6] text-[#24292f] border border-[#d0d7de] shadow-xs',
    badge: 'bg-[#9a6700]/10 text-[#9a6700] border-[#9a6700]/20',
    modalBg: 'bg-[#ffffff]',
  },
  'light-tritanopia': {
    id: 'light-tritanopia',
    name: 'Light Tritanopia',
    isDark: false,
    appBg: 'bg-[#ffffff]',
    sidebarBg: 'bg-[#f6f8fa]',
    headerBg: 'bg-[#ffffff]',
    border: 'border-[#d0d7de]',
    cardBg: 'bg-[#ffffff]',
    subtleBg: 'bg-[#f6f8fa]',
    text: 'text-[#1f2328]',
    headingText: 'text-[#1f2328]',
    subtext: 'text-[#656d76]',
    inputBg: 'bg-[#ffffff]',
    inputBorder: 'border-[#d0d7de]',
    userBubble: 'bg-[#0969da] text-white shadow-sm',
    botBubble: 'bg-[#f6f8fa] border border-[#d0d7de] text-[#1f2328]',
    accentBtn: 'bg-[#cf222e] hover:bg-[#a40e26] text-white shadow-sm',
    secondaryBtn: 'bg-[#ffffff] hover:bg-[#f3f4f6] text-[#24292f] border border-[#d0d7de] shadow-xs',
    badge: 'bg-[#cf222e]/10 text-[#cf222e] border-[#cf222e]/20',
    modalBg: 'bg-[#ffffff]',
  },
};

const PERSONAS: Record<string, string> = {
  'General Assistant':
    'You are an intelligent, articulate, and context-aware AI Assistant. Always resolve multi-turn references accurately.',
  'Resume & Career Coach':
    'You are an expert technical recruiter, engineering leader, and career coach. Review resumes, detect skill gaps, guide interview prep, and optimize bullet points using the Google XYZ formula.',
  'Python & ML Tutor':
    'You are an expert Python and Machine Learning tutor. Explain concepts clearly with code snippets and practical intuition.',
  'Concise & Direct':
    'You are ultra-concise. Respond in sharp bullet points without introductory conversational filler.',
  'Creative Explainer':
    'You explain complex technical topics using vivid real-world analogies, metaphors, and clear step-by-step imagery.',
};

const PROMPT_POOL = [
  'What is machine learning?',
  'What are its types?',
  'Explain the second type with an example.',
  'How do I bridge my skill gap between frontend and cloud DevOps?',
  'Write a Python function for binary search with comments.',
  'How do I write high-impact resume bullet points using the Google XYZ formula?',
  'Explain gradient descent using a hiker descending foggy mountains analogy.',
  'How does transformer self-attention work in simple words?',
  'What are the most common technical interview questions for a Senior Backend role?',
  'What is overfitting in machine learning and how do you prevent it?',
  'Explain backpropagation step by step without dense calculus.',
  'What is reinforcement learning and how is it used in robotics?',
  'Explain the bias-variance tradeoff with a dartboard analogy.',
  'How do Large Language Models predict the next token?',
  'Write a Python generator function to stream large datasets efficiently.',
  'What is transfer learning and why does it save computational power?',
  'What is the difference between shallow copy and deep copy in Python?',
  'How does semantic search differ from keyword matching search?',
  'Write a Python class implementing a Priority Queue with heap.',
  'What is the difference between Precision and Recall in ML metrics?',
];

function getRandomPrompts(count: number = 3, currentList: string[] = []): string[] {
  const candidates = PROMPT_POOL.filter((p) => !currentList.includes(p));
  const pool = candidates.length >= count ? candidates : PROMPT_POOL;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'resume' | 'project' | 'multiturn' | 'files' | 'architecture'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const stored = localStorage.getItem('ai_smart_chatbot_sessions_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [suggestions, setSuggestions] = useState<string[]>(() => getRandomPrompts(3));

  const handleRefreshPrompts = () => {
    setSuggestions((prev) => getRandomPrompts(3, prev));
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsDesktopSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Settings & Prompt Engineering State
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [selectedPersona, setSelectedPersona] = useState('General Assistant');
  const [customInstructions, setCustomInstructions] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [contextTurns, setContextTurns] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // GitHub Theme Settings State (matching user screenshot)
  const [themeModeSetting, setThemeModeSetting] = useState<ThemeModeSetting>(() => {
    try {
      return (localStorage.getItem('gh_theme_mode') as ThemeModeSetting) || 'sync';
    } catch {
      return 'sync';
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const [selectedDarkTheme, setSelectedDarkTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('gh_theme_dark') || 'dark-default';
    } catch {
      return 'dark-default';
    }
  });

  const [selectedLightTheme, setSelectedLightTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('gh_theme_light') || 'light-default';
    } catch {
      return 'light-default';
    }
  });

  const [singleThemeTarget, setSingleThemeTarget] = useState<'dark' | 'light'>('dark');

  const [increaseContrast, setIncreaseContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gh_contrast_increase') === 'true';
    } catch {
      return false;
    }
  });

  const [lightModeContrast, setLightModeContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gh_contrast_light') === 'true';
    } catch {
      return false;
    }
  });

  const [darkModeContrast, setDarkModeContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gh_contrast_dark') === 'true';
    } catch {
      return false;
    }
  });

  const [settingsTab, setSettingsTab] = useState<'appearance' | 'model' | 'views' | 'data'>('appearance');

  // Compute active theme
  const isDarkActive = themeModeSetting === 'sync' ? systemPrefersDark : singleThemeTarget === 'dark';

  let activeThemeKey = 'dark-default';
  if (isDarkActive) {
    if (increaseContrast || darkModeContrast) {
      activeThemeKey = 'dark-high-contrast';
    } else {
      activeThemeKey = selectedDarkTheme;
    }
  } else {
    if (increaseContrast || lightModeContrast) {
      activeThemeKey = 'light-high-contrast';
    } else {
      activeThemeKey = selectedLightTheme;
    }
  }

  const currentTheme = GITHUB_THEMES[activeThemeKey] || GITHUB_THEMES['dark-default'];

  const handleThemeModeChange = (mode: ThemeModeSetting) => {
    setThemeModeSetting(mode);
    try {
      localStorage.setItem('gh_theme_mode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDarkThemeSelect = (themeId: string) => {
    setSelectedDarkTheme(themeId);
    try {
      localStorage.setItem('gh_theme_dark', themeId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLightThemeSelect = (themeId: string) => {
    setSelectedLightTheme(themeId);
    try {
      localStorage.setItem('gh_theme_light', themeId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSingleThemeTarget = (target: 'dark' | 'light') => {
    setSingleThemeTarget(target);
    try {
      localStorage.setItem('gh_single_target', target);
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivateTheme = (target: 'dark' | 'light') => {
    setThemeModeSetting('single');
    try {
      localStorage.setItem('gh_theme_mode', 'single');
    } catch (e) {
      console.error(e);
    }
    handleSingleThemeTarget(target);
  };

  const handleContrastToggle = (checked: boolean) => {
    setIncreaseContrast(checked);
    try {
      localStorage.setItem('gh_contrast_increase', String(checked));
    } catch (e) {
      console.error(e);
    }
  };

  // Multi-turn test runner state
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ step: number; query: string; response: string; status: 'pending' | 'running' | 'success' | 'failed' }>>([]);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);

  // Python Project Files Viewer state
  const [pythonFiles, setPythonFiles] = useState<PythonFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [pyTestOutput, setPyTestOutput] = useState<string | null>(null);
  const [isPyTestRunning, setIsPyTestRunning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    fetch('/api/python-files')
      .then((r) => r.json())
      .then((data) => {
        if (data.files) setPythonFiles(data.files);
      })
      .catch((err) => console.error('Failed to load files:', err));
  }, []);

  const totalTokens = messages.reduce((acc, m) => acc + Math.max(1, Math.round(m.content.length / 4)), 0);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt('');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: timeStr,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const fullSystemPrompt = `${PERSONAS[selectedPersona] || ''} ${customInstructions ? `\nExtra instruction: ${customInstructions}` : ''}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: newHistory.slice(0, -1),
          message: query,
          systemPrompt: fullSystemPrompt,
          model: selectedModel,
          temperature,
          maxHistoryTurns: contextTurns,
        }),
      });

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            role: 'assistant',
            content: data.response,
            timestamp: replyTime,
            model: data.model,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            role: 'assistant',
            content: data.response || `Error: ${data.error || 'Failed to generate response'}`,
            timestamp: replyTime,
            error: true,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ Network error: ${err.message || 'Unable to connect to server'}`,
          timestamp: new Date().toLocaleTimeString(),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically save current conversation to savedSessions in localStorage
  useEffect(() => {
    if (messages.length === 0) return;
    setSavedSessions((prev) => {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 36) : 'Conversation';
      const existingIdx = prev.findIndex((s) => s.id === conversationId);
      const updatedItem: SavedSession = {
        id: conversationId,
        title,
        timestamp: Date.now(),
        messages,
      };

      let newSessions: SavedSession[];
      if (existingIdx >= 0) {
        newSessions = [...prev];
        newSessions[existingIdx] = updatedItem;
      } else {
        newSessions = [updatedItem, ...prev];
      }
      try {
        localStorage.setItem('ai_smart_chatbot_sessions_v1', JSON.stringify(newSessions));
      } catch (err) {
        console.error('Failed to save sessions:', err);
      }
      return newSessions;
    });
  }, [messages, conversationId]);

  const handleSelectSession = (session: SavedSession) => {
    setConversationId(session.id);
    setMessages(session.messages);
    setActiveTab('chat');
    setIsMobileDrawerOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('ai_smart_chatbot_sessions_v1', JSON.stringify(filtered));
      } catch (err) {
        console.error(err);
      }
      return filtered;
    });
    if (conversationId === id) {
      setMessages([]);
      setConversationId('sess_' + Math.random().toString(36).substring(2, 9));
      setSuggestions(getRandomPrompts(3));
    }
  };

  const handleClearAllSessions = () => {
    if (window.confirm('Clear all conversation history? This cannot be undone.')) {
      setSavedSessions([]);
      try {
        localStorage.removeItem('ai_smart_chatbot_sessions_v1');
      } catch (err) {
        console.error(err);
      }
      setMessages([]);
      setConversationId('sess_' + Math.random().toString(36).substring(2, 9));
      setSuggestions(getRandomPrompts(3));
      setIsSettingsOpen(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSavedSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== conversationId);
      try {
        localStorage.setItem('ai_smart_chatbot_sessions_v1', JSON.stringify(filtered));
      } catch (err) {
        console.error(err);
      }
      return filtered;
    });
    setSuggestions(getRandomPrompts(3));
    setIsMobileDrawerOpen(false);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId('sess_' + Math.random().toString(36).substring(2, 9));
    setSuggestions(getRandomPrompts(3));
    setActiveTab('chat');
    setIsMobileDrawerOpen(false);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chat_${conversationId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/download-zip';
  };

  const handleDownloadCurrentFile = () => {
    const file = pythonFiles[activeFileIndex];
    if (!file) return;
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.split('/').pop() || file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Run the 3-Turn Internship Test
  const runMultiTurnTestSuite = async () => {
    setTestRunning(true);
    setTestPassed(null);

    const steps = [
      { step: 1, query: 'What is machine learning?' },
      { step: 2, query: 'What are its types?' },
      { step: 3, query: 'Explain the second type with an example.' },
    ];

    const currentResults = steps.map((s) => ({
      step: s.step,
      query: s.query,
      response: '',
      status: 'pending' as const,
    }));
    setTestResults(currentResults);

    let chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (let i = 0; i < steps.length; i++) {
      setTestResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'running' } : r))
      );

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: chatHistory,
            message: steps[i].query,
            systemPrompt: PERSONAS['General Assistant'],
            model: selectedModel,
            temperature: 0.7,
            maxHistoryTurns: 10,
          }),
        });

        const data = await res.json();
        const reply = data.response || 'Error';

        chatHistory.push({ role: 'user', content: steps[i].query });
        chatHistory.push({ role: 'assistant', content: reply });

        setTestResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, response: reply, status: data.success ? 'success' : 'failed' } : r
          )
        );
      } catch (err: any) {
        setTestResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, response: err.message, status: 'failed' } : r
          )
        );
      }
    }

    // Context resolution check on Turn 3
    const turn3Answer = chatHistory[5]?.content?.toLowerCase() || '';
    const hasUnsupervised =
      turn3Answer.includes('unsupervised') ||
      turn3Answer.includes('second type') ||
      turn3Answer.includes('clustering') ||
      turn3Answer.includes('second');

    setTestPassed(hasUnsupervised);
    setTestRunning(false);
  };

  const runPyTestOnBackend = async () => {
    setIsPyTestRunning(true);
    setPyTestOutput('Running python3 tests/test_multi_turn.py ...\n');
    try {
      const res = await fetch('/api/run-python-test', { method: 'POST' });
      const data = await res.json();
      setPyTestOutput(data.stdout || data.stderr || 'No output recorded.');
    } catch (err: any) {
      setPyTestOutput(`Execution error: ${err.message}`);
    } finally {
      setIsPyTestRunning(false);
    }
  };

  // Shared Sidebar Content Component for Desktop & Mobile Drawer
  const renderSidebarContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col h-[calc(100%-110px)] space-y-3">
        {/* Brand & Internship Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${currentTheme.border} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-bold text-sm tracking-tight ${currentTheme.headingText} flex items-center gap-1.5`}>
                NEXORA AI
              </h2>
              <p className={`text-[11px] ${currentTheme.subtext}`}>Conversational & Career Engine</p>
            </div>
          </div>
          {isMobile ? (
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`p-1.5 rounded-lg ${currentTheme.subtext} hover:${currentTheme.text} ${isDarkActive ? 'hover:bg-slate-800' : 'hover:bg-slate-200'} transition-colors cursor-pointer`}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className={`p-1.5 rounded-lg ${currentTheme.subtext} hover:${currentTheme.text} ${isDarkActive ? 'hover:bg-slate-800' : 'hover:bg-slate-200'} transition-colors cursor-pointer`}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Action: New Chat Button */}
        <button
          onClick={handleNewConversation}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-medium text-xs flex items-center justify-between shadow-md shadow-indigo-600/20 transition-all group shrink-0 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">New</span>
        </button>

        {/* Workspace Quick Nav: Chat, Resume AI & Project Generator */}
        <div className="grid grid-cols-3 gap-1 shrink-0">
          <button
            onClick={() => {
              setActiveTab('chat');
              if (isMobile) setIsMobileDrawerOpen(false);
            }}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                : !isDarkActive
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
                : `${currentTheme.secondaryBtn}`
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('resume');
              if (isMobile) setIsMobileDrawerOpen(false);
            }}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'resume'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                : !isDarkActive
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
                : `${currentTheme.secondaryBtn}`
            }`}
          >
            <Brain className="w-3 h-3 text-indigo-500" />
            <span>Resume</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('project');
              if (isMobile) setIsMobileDrawerOpen(false);
            }}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer border ${
              activeTab === 'project'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold'
                : !isDarkActive
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
                : `${currentTheme.secondaryBtn}`
            }`}
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Project</span>
          </button>
        </div>

        {/* Old Chats / Previous Conversations Section */}
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          <div className={`flex items-center justify-between text-[11px] font-semibold ${currentTheme.subtext} uppercase tracking-wider px-1 pb-2 shrink-0`}>
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Previous Chats</span>
            </div>
            {savedSessions.length > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDarkActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                {savedSessions.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {savedSessions.length === 0 ? (
              <div className={`p-4 text-center rounded-xl ${
                !isDarkActive ? 'bg-white/70 border-slate-200/80 shadow-2xs' : `${currentTheme.subtleBg} border ${currentTheme.border}`
              } border space-y-1 my-2`}>
                <MessageSquare className={`w-5 h-5 mx-auto mb-1 ${currentTheme.subtext} opacity-70`} />
                <p className={`text-xs font-semibold ${currentTheme.text}`}>No previous chats</p>
                <p className={`text-[11px] ${currentTheme.subtext} leading-snug`}>
                  Conversations are saved automatically here as you chat.
                </p>
              </div>
            ) : (
              savedSessions.map((session) => {
                const isActive = session.id === conversationId;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? isDarkActive
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200 shadow-sm'
                          : 'bg-white border-indigo-300 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500/10'
                        : isDarkActive
                        ? 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/60 hover:border-slate-700 text-slate-300'
                        : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 pr-1 flex-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : currentTheme.subtext
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-medium truncate leading-tight ${currentTheme.text}`}>
                          {session.title || 'Conversation'}
                        </div>
                        <div className={`text-[10px] ${currentTheme.subtext} mt-0.5 flex items-center gap-1.5`}>
                          <span>{formatRelativeTime(session.timestamp)}</span>
                          <span>•</span>
                          <span>{session.messages.length} msgs</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md ${currentTheme.subtext} hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0 cursor-pointer`}
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area: Settings Button Only */}
      <div className={`pt-3 border-t ${currentTheme.border} shrink-0`}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl ${
            !isDarkActive
              ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300'
              : currentTheme.secondaryBtn
          } text-xs font-medium transition-all group cursor-pointer`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${isDarkActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center group-hover:rotate-45 transition-transform duration-200`}>
              <Settings className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className={`leading-tight font-semibold ${currentTheme.headingText}`}>Settings</div>
              <div className={`text-[10px] ${currentTheme.subtext} truncate max-w-[140px]`}>{selectedPersona}</div>
            </div>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDarkActive ? 'bg-slate-800 text-indigo-300 border border-slate-700/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium'}`}>
            Open
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${
      !isDarkActive
        ? 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9]/80 to-[#eef2ff]/50 text-slate-800'
        : `${currentTheme.appBg} ${currentTheme.text}`
    } font-sans selection:bg-indigo-500/30 selection:text-indigo-600 transition-colors duration-200 relative`}>
      {/* Ambient background mesh in light mode */}
      {!isDarkActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-200/25 via-purple-100/20 to-transparent rounded-full blur-3xl opacity-70" />
          <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-sky-200/25 via-blue-100/20 to-transparent rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-32 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-violet-200/20 via-indigo-100/25 to-transparent rounded-full blur-3xl opacity-60" />
        </div>
      )}

      {/* DESKTOP SIDEBAR (Visible on md+ screens, fully toggleable) */}
      <AnimatePresence initial={false}>
        {isDesktopSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`hidden md:flex shrink-0 border-r ${
              !isDarkActive
                ? 'border-slate-200/70 bg-[#f8fafc]/90'
                : `${currentTheme.border} ${currentTheme.sidebarBg}`
            } backdrop-blur-xl flex-col justify-between p-4 z-20 overflow-hidden transition-colors`}
          >
            <div className="w-[288px] h-full flex flex-col justify-between">
              {renderSidebarContent(false)}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MOBILE SLIDE-OVER DRAWER (Visible on mobile when open) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className={`md:hidden fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] ${currentTheme.modalBg} border-r ${currentTheme.border} p-4 z-50 shadow-2xl flex flex-col justify-between`}
            >
              {renderSidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* RESPONSIVE TOP HEADER */}
        <header className={`h-14 shrink-0 border-b ${
          !isDarkActive
            ? 'border-slate-200/70 bg-white/75 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
            : `${currentTheme.border} ${currentTheme.headerBg}`
        } backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-10 transition-colors`}>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar Toggle Button (Desktop & Mobile) */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsMobileDrawerOpen(true);
                } else {
                  setIsDesktopSidebarOpen((prev) => !prev);
                }
              }}
              className={`p-2 rounded-xl ${
                !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300'
                  : currentTheme.secondaryBtn
              } transition-all flex items-center justify-center cursor-pointer`}
              title={isDesktopSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
              aria-label="Toggle Sidebar"
            >
              <span className="hidden md:block">
                {isDesktopSidebarOpen ? (
                  <PanelLeftClose className={`w-4 h-4 ${currentTheme.subtext}`} />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-indigo-500" />
                )}
              </span>
              <Menu className="w-4 h-4 md:hidden" />
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <span className={`text-xs sm:text-sm font-bold tracking-tight ${
                !isDarkActive ? 'text-slate-900' : currentTheme.headingText
              } truncate max-w-[160px] sm:max-w-none`}>
                NEXORA AI
              </span>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab !== 'chat' && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  isDarkActive
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                    : 'bg-indigo-50/90 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100 shadow-2xs'
                } border text-xs font-medium transition-all cursor-pointer`}
                title="Return to Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Chat</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab(activeTab === 'resume' ? 'chat' : 'resume')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'resume'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-xs font-semibold'
                  : !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs hover:border-slate-300'
                  : currentTheme.secondaryBtn
              }`}
              title="AI Resume Analysis & Skill Gap Detection"
            >
              <Brain className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Resume Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'project' ? 'chat' : 'project')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'project'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-xs font-semibold'
                  : !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs hover:border-slate-300'
                  : currentTheme.secondaryBtn
              }`}
              title="AI Requirement-to-Project Generator"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Idea to Project</span>
            </button>
            <button
              onClick={handleNewConversation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 hover:text-slate-900'
                  : currentTheme.secondaryBtn
              } text-xs font-medium transition-all cursor-pointer`}
              title="New Conversation"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                !isDarkActive
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 hover:text-slate-900'
                  : currentTheme.secondaryBtn
              } text-xs font-medium transition-all cursor-pointer`}
              title="Open Chatbot Settings & Views"
            >
              <Settings className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* TAB 1: LIVE CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem-2.5rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {messages.length === 0 ? (
                <div className="min-h-[calc(100vh-13rem)] flex flex-col justify-center items-center py-6 px-2 sm:px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl w-full text-center space-y-6 sm:space-y-7"
                  >
                    {/* Glowing AI Icon with subtle floating motion */}
                    <div className="relative mx-auto w-fit">
                      {!isDarkActive && (
                        <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-sky-400/20 rounded-[32px] blur-xl -z-10 animate-pulse" />
                      )}
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl ${
                          !isDarkActive ? 'shadow-indigo-500/25 ring-4 ring-white/90' : 'shadow-indigo-500/20'
                        }`}
                      >
                        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                      </motion.div>
                    </div>

                    {/* Headline & Subtitle */}
                    <div className="space-y-2">
                      <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        !isDarkActive ? 'text-slate-900' : currentTheme.headingText
                      }`}>
                        NEXORA AI
                      </h2>
                      <p className={`text-xs sm:text-sm ${
                        !isDarkActive ? 'text-slate-500' : currentTheme.subtext
                      } leading-relaxed max-w-md mx-auto`}>
                        How can I help you today? Ask any question or select an idea below to get started.
                      </p>
                    </div>

                    {/* Suggested Prompts Card Component */}
                    <div className={`rounded-2xl p-4 sm:p-5 text-left space-y-3.5 transition-all ${
                      !isDarkActive
                        ? 'bg-white/75 backdrop-blur-xl border border-white/90 shadow-xl shadow-slate-200/50'
                        : `${currentTheme.subtleBg} border ${currentTheme.border}`
                    }`}>
                      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-md ${!isDarkActive ? 'bg-amber-50 text-amber-500' : 'text-amber-500'}`}>
                            <Flame className="w-3.5 h-3.5" />
                          </div>
                          <span className={`uppercase font-bold tracking-wider text-[11px] ${
                            !isDarkActive ? 'text-slate-600' : currentTheme.subtext
                          }`}>
                            Suggested Prompts
                          </span>
                        </div>
                        <button
                          onClick={handleRefreshPrompts}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border transition-all font-medium cursor-pointer ${
                            isDarkActive
                              ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                              : 'bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-700 border-indigo-200/70 shadow-2xs hover:shadow-xs'
                          }`}
                          title="Shuffle for new random prompts"
                        >
                          <Shuffle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Shuffle</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {suggestions.map((s, idx) => (
                          <motion.button
                            key={s}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.22, delay: idx * 0.05 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSendMessage(s)}
                            className={`p-3 sm:p-3.5 rounded-xl border text-xs text-left transition-all flex flex-col justify-between group cursor-pointer ${
                              isDarkActive
                                ? 'bg-[#0d1117] hover:bg-[#161b22] border-[#30363d] hover:border-indigo-500/40 text-slate-300 hover:text-white'
                                : 'bg-gradient-to-b from-white via-white to-slate-50/60 hover:from-white hover:to-indigo-50/30 border-slate-200/80 hover:border-indigo-300/90 hover:shadow-md hover:shadow-indigo-500/5 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <span className={`font-semibold text-[11px] mb-1.5 ${
                              isDarkActive
                                ? 'text-indigo-400 group-hover:text-indigo-300'
                                : 'text-indigo-600 font-bold'
                            }`}>
                              Idea {idx + 1}
                            </span>
                            <span className={`text-xs leading-relaxed ${
                              isDarkActive
                                ? 'text-slate-300 group-hover:text-white'
                                : 'text-slate-700 group-hover:text-slate-900'
                            }`}>
                              {s}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`flex gap-2 sm:gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {m.role === 'assistant' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}

                        <div
                          className={`group relative max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                            m.role === 'user'
                              ? `${currentTheme.userBubble} rounded-tr-sm`
                              : m.error
                              ? isDarkActive
                                ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200 rounded-tl-sm'
                                : 'bg-rose-50 border border-rose-200 text-rose-800 rounded-tl-sm'
                              : !isDarkActive
                              ? 'bg-white/95 border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-sm backdrop-blur-md'
                              : `${currentTheme.botBubble} rounded-tl-sm backdrop-blur-md`
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-sans break-words">{m.content}</div>

                          <div className={`flex items-center justify-between gap-3 mt-2 pt-1.5 border-t text-[10px] ${
                            isDarkActive ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'
                          }`}>
                            <span className="font-mono">{m.timestamp}</span>
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className={`opacity-80 sm:opacity-0 group-hover:opacity-100 hover:${currentTheme.text} transition-opacity p-0.5 cursor-pointer`}
                              title="Copy text"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {m.role === 'user' && (
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDarkActive ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                          }`}>
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 sm:gap-3.5 justify-start"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 animate-pulse">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className={`${isDarkActive ? 'bg-[#161b22] border-[#30363d] text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-600 shadow-xs'} border rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs flex items-center gap-2.5`}>
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                        <span className="text-[11px] sm:text-xs">Referencing context & generating response...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className={`p-3 sm:p-4 md:p-5 ${
              !isDarkActive
                ? 'bg-gradient-to-t from-slate-100/90 via-slate-50/60 to-transparent backdrop-blur-md border-t border-slate-200/40'
                : `${currentTheme.headerBg} backdrop-blur-xl border-t ${currentTheme.border}`
            } shrink-0 transition-colors`}>
              <div className={`max-w-3xl mx-auto flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl transition-all ${
                !isDarkActive
                  ? 'bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-lg shadow-slate-200/60 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 focus-within:shadow-indigo-500/10'
                  : `${currentTheme.inputBg} border ${currentTheme.inputBorder} focus-within:border-indigo-500`
              }`}>
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask a question or continue conversation..."
                  disabled={isLoading}
                  className={`flex-1 bg-transparent border-0 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm ${
                    !isDarkActive ? 'text-slate-800 placeholder-slate-400' : `${currentTheme.text} placeholder-slate-500`
                  } focus:outline-none`}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isLoading}
                  className={`px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl ${
                    !isDarkActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40'
                      : currentTheme.accentBtn
                  } text-xs sm:text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: RESUME ANALYSIS & SKILL GAP DETECTION */}
        {activeTab === 'resume' && (
          <ResumeAnalyzer
            currentTheme={currentTheme}
            isDarkActive={isDarkActive}
            selectedModel={selectedModel}
            onOpenChatWithPrompt={(promptText) => {
              setActiveTab('chat');
              handleSendMessage(promptText);
            }}
          />
        )}

        {/* TAB: AI REQUIREMENT-TO-PROJECT GENERATOR */}
        {activeTab === 'project' && (
          <ProjectGenerator
            currentTheme={currentTheme}
            isDarkActive={isDarkActive}
            selectedModel={selectedModel}
            onOpenChatWithPrompt={(promptText) => {
              setActiveTab('chat');
              handleSendMessage(promptText);
            }}
          />
        )}

        {/* TAB 2: MULTI-TURN TEST SUITE */}
        {activeTab === 'multiturn' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${currentTheme.border}`}>
              <div>
                <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.headingText} flex items-center gap-2`}>
                  <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  Multi-Turn Context Test
                </h2>
                <p className={`text-xs ${currentTheme.subtext} mt-0.5`}>
                  Verifies anaphoric reference resolution ("the second type").
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={runMultiTurnTestSuite}
                disabled={testRunning}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {testRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                {testRunning ? 'Testing...' : 'Run 3-Turn Test'}
              </motion.button>
            </div>

            {testPassed !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 sm:p-4 rounded-xl border flex items-start sm:items-center gap-2.5 sm:gap-3 ${
                  testPassed
                    ? isDarkActive
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : isDarkActive
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="font-semibold text-xs sm:text-sm">
                    {testPassed
                      ? '✅ MULTI-TURN VERIFICATION PASSED'
                      : '⚠️ Multi-turn reference requires inspection'}
                  </div>
                  <div className="text-[11px] sm:text-xs opacity-90 mt-0.5">
                    {testPassed
                      ? 'Turn 3 correctly identified and explained "the second type" (Unsupervised Learning) from Turn 2.'
                      : 'Please check the detailed transcript below.'}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  step: 1,
                  title: 'Step 1: Baseline Definition',
                  prompt: 'What is machine learning?',
                },
                {
                  step: 2,
                  title: 'Step 2: Enumeration of Types',
                  prompt: 'What are its types?',
                },
                {
                  step: 3,
                  title: 'Step 3: Reference Resolution',
                  prompt: 'Explain the second type with an example.',
                },
              ].map((item, idx) => {
                const res = testResults[idx];
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`p-3.5 sm:p-5 rounded-xl ${currentTheme.cardBg} border ${currentTheme.border} ${isDarkActive ? '' : 'shadow-xs'} space-y-2.5 sm:space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold font-mono">
                          {item.step}
                        </span>
                        <span className={`font-semibold text-xs sm:text-sm ${currentTheme.headingText}`}>{item.title}</span>
                      </div>
                      {res && (
                        <span
                          className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                            res.status === 'success'
                              ? isDarkActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : res.status === 'running'
                              ? isDarkActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : res.status === 'failed'
                              ? isDarkActive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isDarkActive ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className={`p-2.5 sm:p-3 rounded-lg ${currentTheme.subtleBg} border ${currentTheme.border} text-xs font-mono text-indigo-600 dark:text-indigo-400`}>
                      User: "{item.prompt}"
                    </div>

                    {res?.response && (
                      <div className={`p-2.5 sm:p-3 rounded-lg ${currentTheme.subtleBg} border ${currentTheme.border} text-xs ${currentTheme.text} whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed`}>
                        <span className={`text-[10px] ${currentTheme.subtext} uppercase font-bold block mb-1`}>
                          Assistant Response:
                        </span>
                        {res.response}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CODEBASE EXPLORER */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* File List / Mobile Dropdown */}
            <div className={`md:w-64 border-b md:border-b-0 md:border-r ${currentTheme.border} ${currentTheme.sidebarBg} p-2 sm:p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 md:gap-0`}>
              <div className={`hidden md:block text-[11px] font-semibold ${currentTheme.subtext} uppercase tracking-wider px-2 py-1 mb-2`}>
                Project Files
              </div>
              {pythonFiles.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`whitespace-nowrap px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 md:gap-2 transition-all ${
                    activeFileIndex === idx
                      ? isDarkActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-300 font-semibold shadow-xs'
                      : `${currentTheme.subtext} hover:${currentTheme.text} ${isDarkActive ? 'hover:bg-slate-800/60' : 'hover:bg-slate-200/60'}`
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}

              <div className={`md:pt-4 md:border-t ${currentTheme.border} md:mt-4 shrink-0`}>
                <button
                  onClick={runPyTestOnBackend}
                  disabled={isPyTestRunning}
                  className={`whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 md:py-2 rounded-lg ${currentTheme.secondaryBtn} text-xs font-medium transition-all`}
                >
                  <Terminal className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  {isPyTestRunning ? 'Running...' : 'Run python test'}
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className={`flex-1 flex flex-col overflow-hidden ${currentTheme.appBg}`}>
              <div className={`h-10 sm:h-11 border-b ${currentTheme.border} px-3 sm:px-4 flex items-center justify-between text-xs font-mono ${currentTheme.subtext} gap-2 shrink-0 ${currentTheme.headerBg}`}>
                <div className="flex items-center gap-2 truncate">
                  <span className={`truncate font-semibold ${currentTheme.headingText}`}>
                    {pythonFiles[activeFileIndex]?.name || 'Loading...'}
                  </span>
                  <span className={`hidden sm:inline px-1.5 py-0.5 rounded text-[10px] ${isDarkActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {pythonFiles[activeFileIndex]?.language || 'code'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadCurrentFile}
                    className={`px-2 py-1 rounded ${currentTheme.secondaryBtn} text-[11px] font-sans flex items-center gap-1 transition-colors`}
                    title="Download this file"
                  >
                    <Download className="w-3 h-3 text-cyan-500" />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  <button
                    onClick={handleDownloadZip}
                    className={`px-2 py-1 rounded ${isDarkActive ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'} border text-[11px] font-sans flex items-center gap-1 transition-colors`}
                    title="Download entire project as ZIP"
                  >
                    <FolderCode className="w-3 h-3" />
                    <span>Project ZIP</span>
                  </button>

                  <button
                    onClick={() =>
                      handleCopy(
                        pythonFiles[activeFileIndex]?.content || '',
                        pythonFiles[activeFileIndex]?.name || ''
                      )
                    }
                    className={`px-2 py-1 rounded ${currentTheme.secondaryBtn} text-[11px] font-sans flex items-center gap-1 transition-colors`}
                    title="Copy code to clipboard"
                  >
                    {copiedId === pythonFiles[activeFileIndex]?.name ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                </div>
              </div>

              <div className={`flex-1 overflow-auto p-3 sm:p-4 ${isDarkActive ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'}`}>
                <pre className={`text-xs font-mono ${isDarkActive ? 'text-slate-300' : 'text-slate-800'} leading-relaxed overflow-x-auto`}>
                  <code>{pythonFiles[activeFileIndex]?.content}</code>
                </pre>
              </div>

              {pyTestOutput && (
                <div className={`h-36 sm:h-44 border-t ${currentTheme.border} ${isDarkActive ? 'bg-slate-950/95 text-emerald-400' : 'bg-slate-900 text-emerald-300'} p-3 overflow-auto font-mono text-[11px]`}>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-between">
                    <span>Python CLI Output</span>
                    <button
                      onClick={() => setPyTestOutput(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap">{pyTestOutput}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE DIAGRAM */}
        {activeTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8">
            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.headingText} flex items-center gap-2`}>
                <Network className="w-5 h-5 text-indigo-500" />
                NEXORA AI System Architecture
              </h2>
              <p className={`text-xs ${currentTheme.subtext} mt-1`}>
                Pure LLM API Conversational Architecture — No RAG, No Vector DBs.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  step: '01',
                  label: 'User Input',
                  desc: 'User inputs conversational message or follow-up question.',
                  icon: User,
                  color: 'from-blue-600 to-indigo-600',
                },
                {
                  step: '02',
                  label: 'Streamlit Chat UI / Frontend',
                  desc: 'Captures input, enforces non-empty validation, displays user message.',
                  icon: MessageSquare,
                  color: 'from-indigo-600 to-violet-600',
                },
                {
                  step: '03',
                  label: 'Session State / Conversation History',
                  desc: 'Maintains stateful array of turns [{role, content, timestamp}], tracks token counts.',
                  icon: Layers,
                  color: 'from-violet-600 to-purple-600',
                },
                {
                  step: '04',
                  label: 'Prompt Builder & System Instructions',
                  desc: 'Applies persona guidance, context retention directives, formats windowed turns.',
                  icon: Cpu,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  step: '05',
                  label: 'LLM API (Gemini Model)',
                  desc: 'Google GenAI REST/SDK endpoint processes system instruction + conversational history.',
                  icon: Sparkles,
                  color: 'from-pink-600 to-rose-600',
                },
                {
                  step: '06',
                  label: 'AI Response Generation',
                  desc: 'Extracts generated candidate text, applies error checking, handles rate limits/fallbacks.',
                  icon: Bot,
                  color: 'from-rose-600 to-amber-600',
                },
                {
                  step: '07',
                  label: 'Update History & Display',
                  desc: 'Appends assistant message to session state, increments token counters, renders animated response.',
                  icon: ShieldCheck,
                  color: 'from-emerald-600 to-teal-600',
                },
              ].map((node, i) => (
                <motion.div
                  key={node.step}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${currentTheme.cardBg} border ${currentTheme.border} ${isDarkActive ? '' : 'shadow-xs'}`}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${node.color} flex items-center justify-center text-white shrink-0 shadow-md font-bold font-mono text-xs sm:text-sm`}
                  >
                    {node.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-xs sm:text-sm ${currentTheme.headingText} truncate`}>{node.label}</h3>
                    <p className={`text-[11px] sm:text-xs ${currentTheme.subtext} mt-0.5 leading-relaxed`}>{node.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`relative w-full max-w-2xl sm:max-w-3xl ${currentTheme.modalBg} border ${currentTheme.border} ${currentTheme.text} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b ${currentTheme.border} ${isDarkActive ? 'bg-slate-900/70' : 'bg-slate-50'} shrink-0`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isDarkActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold ${currentTheme.headingText}`}>
                      NEXORA AI Settings & Configuration
                    </h3>
                    <p className={`text-[11px] sm:text-xs ${currentTheme.subtext}`}>
                      Configure Theme mode, LLM models, personas, system instructions & exports
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className={`p-1.5 rounded-lg ${currentTheme.subtext} hover:${currentTheme.text} ${isDarkActive ? 'hover:bg-slate-800' : 'hover:bg-slate-200'} transition-colors`}
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Navigation Tabs */}
              <div className={`flex border-b ${currentTheme.border} ${isDarkActive ? 'bg-slate-900/50' : 'bg-slate-100/70'} px-4 sm:px-6 gap-1 shrink-0 overflow-x-auto`}>
                <button
                  type="button"
                  onClick={() => setSettingsTab('appearance')}
                  className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    settingsTab === 'appearance'
                      ? `border-blue-600 ${currentTheme.headingText} font-bold`
                      : `border-transparent ${currentTheme.subtext} hover:${currentTheme.text}`
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Theme mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('model')}
                  className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    settingsTab === 'model'
                      ? `border-blue-600 ${currentTheme.headingText} font-bold`
                      : `border-transparent ${currentTheme.subtext} hover:${currentTheme.text}`
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Model & Persona</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('views')}
                  className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    settingsTab === 'views'
                      ? `border-blue-600 ${currentTheme.headingText} font-bold`
                      : `border-transparent ${currentTheme.subtext} hover:${currentTheme.text}`
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Workspace Views</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('data')}
                  className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    settingsTab === 'data'
                      ? `border-blue-600 ${currentTheme.headingText} font-bold`
                      : `border-transparent ${currentTheme.subtext} hover:${currentTheme.text}`
                  }`}
                >
                  <FolderCode className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Data & Exports</span>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className={`p-4 sm:p-6 overflow-y-auto space-y-5 text-xs ${currentTheme.text}`}>
                {/* TAB 1: THEME MODE (GitHub Theme Settings UI) */}
                {settingsTab === 'appearance' && (
                  <div className="space-y-5">
                    {/* Header Description */}
                    <div>
                      <h4 className={`text-sm font-bold ${currentTheme.headingText}`}>Theme mode</h4>
                      <p className={`text-xs ${currentTheme.subtext} mt-1 leading-relaxed`}>
                        Choose how the application looks to you. Select a single theme, or sync with your system and automatically switch between day and night themes.
                      </p>
                    </div>

                    {/* Mode Selector Dropdown */}
                    <div className="space-y-1.5 max-w-sm">
                      <label className={`text-xs font-semibold ${currentTheme.headingText} flex items-center gap-1.5`}>
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                        Theme mode
                      </label>
                      <select
                        value={themeModeSetting}
                        onChange={(e) => handleThemeModeChange(e.target.value as ThemeModeSetting)}
                        className={`w-full text-xs ${isDarkActive ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'} border rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer`}
                      >
                        <option value="sync">Sync with system</option>
                        <option value="single">Single theme</option>
                      </select>
                    </div>

                    {/* Single Theme Toggle If Single Mode Selected */}
                    {themeModeSetting === 'single' && (
                      <div className={`p-3 rounded-xl ${isDarkActive ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between`}>
                        <div>
                          <div className={`font-semibold ${currentTheme.headingText} text-xs`}>Active Theme Preference</div>
                          <div className={`text-[11px] ${currentTheme.subtext}`}>Click on Day theme or Night theme below to activate it.</div>
                        </div>
                        <div className={`inline-flex rounded-lg ${isDarkActive ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/80 border-slate-300'} p-1 border gap-1`}>
                          <button
                            type="button"
                            onClick={() => handleSingleThemeTarget('light')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                              singleThemeTarget === 'light'
                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                : `${currentTheme.subtext} hover:${currentTheme.text}`
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            Day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSingleThemeTarget('dark')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                              singleThemeTarget === 'dark'
                                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                                : `${currentTheme.subtext} hover:${currentTheme.text}`
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            Night
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Theme Cards Grid (Day theme & Night theme) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* CARD 1: DAY THEME */}
                      <div
                        onClick={() => handleActivateTheme('light')}
                        className={`rounded-2xl border p-4 transition-all flex flex-col justify-between cursor-pointer ${
                          !isDarkActive
                            ? 'bg-white border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                            : isDarkActive
                            ? 'bg-slate-900/40 border-slate-800/90 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-amber-500" />
                              <span className={`font-semibold text-sm ${currentTheme.headingText}`}>Day theme</span>
                            </div>
                            {!isDarkActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateTheme('light');
                                }}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-600 dark:text-blue-300 hover:bg-blue-600/40 border border-blue-500/30 font-medium transition-colors cursor-pointer"
                              >
                                Select
                              </button>
                            )}
                          </div>

                          <p className={`text-[11px] ${currentTheme.subtext} leading-snug`}>
                            Choose the theme you'd like to use during the day.
                          </p>

                          {/* Theme Variant Select */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={selectedLightTheme}
                              onChange={(e) => {
                                handleLightThemeSelect(e.target.value);
                                if (!isDarkActive) {
                                  // Keep current variant
                                }
                              }}
                              className={`w-full text-xs ${isDarkActive ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'} border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer`}
                            >
                              <option value="light-default">Light default</option>
                              <option value="light-high-contrast">Light high contrast</option>
                              <option value="light-colorblind">Light Protanopia & Deuteranopia</option>
                              <option value="light-tritanopia">Light Tritanopia</option>
                            </select>
                          </div>

                          {/* Graphic Illustration Preview of Day Theme */}
                          <div
                            className="group relative rounded-xl border border-slate-300 bg-[#ffffff] p-3 shadow-sm space-y-2.5 transition-all select-none overflow-hidden"
                          >
                            {/* Mini Topbar */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-slate-900 flex items-center justify-center text-[9px] text-white font-bold">
                                  ⌘
                                </div>
                                <div className="h-3 w-16 bg-slate-100 border border-slate-300 rounded-full px-1 flex items-center">
                                  <div className="h-1 w-8 bg-slate-300 rounded" />
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-200" />
                                <div className="w-3 h-3 rounded-full bg-slate-300" />
                              </div>
                            </div>

                            {/* Mini Workspace Content */}
                            <div className="flex gap-2">
                              {/* Left Mini Sidebar */}
                              <div className="w-16 space-y-1 py-0.5">
                                <div className="h-2 w-12 bg-blue-100 rounded text-[7px] text-blue-600 font-semibold px-1 flex items-center">
                                  Chat
                                </div>
                                <div className="h-1.5 w-10 bg-slate-100 rounded" />
                                <div className="h-1.5 w-14 bg-slate-100 rounded" />
                              </div>

                              {/* Main Mini Chat View */}
                              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
                                <div className="flex justify-end">
                                  <div className="h-3 w-20 bg-blue-600 rounded text-[7px] text-white px-1 flex items-center font-medium">
                                    Hello AI
                                  </div>
                                </div>
                                <div className="flex justify-start">
                                  <div className="h-3.5 w-28 bg-white border border-slate-200 rounded text-[7px] text-slate-700 px-1 flex items-center">
                                    Ready to assist you
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Color Palette Swatches */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[9px] font-mono text-slate-500">Light palette</span>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#1f883d]" title="Green" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#0969da]" title="Blue" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#8250df]" title="Purple" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#bc4c00]" title="Orange" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#cf222e]" title="Red" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: NIGHT THEME */}
                      <div
                        onClick={() => handleActivateTheme('dark')}
                        className={`rounded-2xl border p-4 transition-all flex flex-col justify-between cursor-pointer ${
                          isDarkActive
                            ? 'bg-slate-900/90 border-blue-500/80 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-blue-400" />
                              <span className={`font-semibold text-sm ${currentTheme.headingText}`}>Night theme</span>
                            </div>
                            {isDarkActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateTheme('dark');
                                }}
                                className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-600 dark:text-blue-300 hover:bg-blue-600/40 border border-blue-500/30 font-medium transition-colors cursor-pointer"
                              >
                                Select
                              </button>
                            )}
                          </div>

                          <p className={`text-[11px] ${currentTheme.subtext} leading-snug`}>
                            Choose the theme you'd like to use during the night.
                          </p>

                          {/* Theme Variant Select */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={selectedDarkTheme}
                              onChange={(e) => {
                                handleDarkThemeSelect(e.target.value);
                              }}
                              className={`w-full text-xs ${isDarkActive ? 'bg-slate-950 border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'} border rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer`}
                            >
                              <option value="dark-default">Dark default</option>
                              <option value="dark-dimmed">Dark dimmed</option>
                              <option value="dark-high-contrast">Dark high contrast</option>
                              <option value="dark-colorblind">Dark Protanopia & Deuteranopia</option>
                              <option value="dark-tritanopia">Dark Tritanopia</option>
                            </select>
                          </div>

                          {/* Graphic Illustration Preview of Night Theme */}
                          <div
                            className="group relative rounded-xl border border-[#30363d] bg-[#0d1117] p-3 shadow-md space-y-2.5 transition-all select-none overflow-hidden"
                          >
                            {/* Mini Topbar */}
                            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-[#1f6feb] flex items-center justify-center text-[9px] text-white font-bold">
                                  ⌘
                                </div>
                                <div className="h-3 w-16 bg-[#161b22] border border-[#30363d] rounded-full px-1 flex items-center">
                                  <div className="h-1 w-8 bg-[#30363d] rounded" />
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#21262d]" />
                                <div className="w-3 h-3 rounded-full bg-[#30363d]" />
                              </div>
                            </div>

                            {/* Mini Workspace Content */}
                            <div className="flex gap-2">
                              {/* Left Mini Sidebar */}
                              <div className="w-16 space-y-1 py-0.5">
                                <div className="h-2 w-12 bg-[#388bfd]/20 border border-[#388bfd]/30 rounded text-[7px] text-[#58a6ff] font-semibold px-1 flex items-center">
                                  Chat
                                </div>
                                <div className="h-1.5 w-10 bg-[#21262d] rounded" />
                                <div className="h-1.5 w-14 bg-[#21262d] rounded" />
                              </div>

                              {/* Main Mini Chat View */}
                              <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg p-2 space-y-1.5">
                                <div className="flex justify-end">
                                  <div className="h-3 w-20 bg-[#1f6feb] rounded text-[7px] text-white px-1 flex items-center font-medium">
                                    Hello AI
                                  </div>
                                </div>
                                <div className="flex justify-start">
                                  <div className="h-3.5 w-28 bg-[#21262d] border border-[#30363d] rounded text-[7px] text-[#c9d1d9] px-1 flex items-center">
                                    Ready to assist you
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Color Palette Swatches */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#30363d]">
                              <span className="text-[9px] font-mono text-slate-400">Dark palette</span>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#238636]" title="Green" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#1f6feb]" title="Blue" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#a371f7]" title="Purple" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#db6d28]" title="Orange" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#f85149]" title="Red" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contrast & Accessibility Preferences */}
                    <div className={`p-3.5 rounded-xl ${isDarkActive ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-2.5`}>
                      <div className={`font-semibold ${currentTheme.headingText} text-xs`}>Accessibility & High Contrast</div>
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={increaseContrast}
                          onChange={(e) => handleContrastToggle(e.target.checked)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <div>
                          <div className={`text-xs font-medium ${currentTheme.headingText}`}>
                            Increase contrast of UI elements (Experimental)
                          </div>
                          <div className={`text-[11px] ${currentTheme.subtext} leading-relaxed mt-0.5`}>
                            Maximizes border clarity, text luminance, and contrast distinctions across both day and night themes.
                          </div>
                        </div>
                      </label>
                      <div className={`pt-2 border-t ${currentTheme.border} flex flex-wrap items-center justify-between text-[11px] ${currentTheme.subtext} gap-2`}>
                        <span>
                          System preference detected:{' '}
                          <span className={`${currentTheme.headingText} font-medium`}>
                            {systemPrefersDark ? 'Dark mode' : 'Light mode'}
                          </span>
                        </span>
                        <span>
                          Current active theme:{' '}
                          <span className="text-indigo-500 font-mono font-medium">
                            {currentTheme.name}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MODEL & PERSONA */}
                {settingsTab === 'model' && (
                  <div className="space-y-4">
                    {/* Model Architecture */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold ${currentTheme.headingText} flex items-center gap-1.5`}>
                        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                        LLM Model Architecture
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`w-full text-xs ${isDarkActive ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'} border rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500`}
                      >
                        <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Recommended - Fastest & Low Latency)</option>
                        <option value="gemini-3.8-flash">gemini-3.8-flash (Standard Multimodal Intelligence)</option>
                        <option value="gemini-flash-latest">gemini-flash-latest (General Fast Inference)</option>
                        <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview (Next-Gen Preview)</option>
                      </select>
                    </div>

                    {/* Persona & System Prompt */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold ${currentTheme.headingText} flex items-center gap-1.5`}>
                        <Bot className="w-3.5 h-3.5 text-indigo-500" />
                        Chatbot Persona & System Prompt
                      </label>
                      <select
                        value={selectedPersona}
                        onChange={(e) => setSelectedPersona(e.target.value)}
                        className={`w-full text-xs ${isDarkActive ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-800 shadow-xs'} border rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500`}
                      >
                        {Object.keys(PERSONAS).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <div className={`p-2.5 rounded-lg ${isDarkActive ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border text-[11px] ${currentTheme.subtext} italic`}>
                        "{PERSONAS[selectedPersona]}"
                      </div>
                    </div>

                    {/* Sliders: Temperature & Context Turns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className={`p-3 sm:p-3.5 rounded-xl ${isDarkActive ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border space-y-2`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${currentTheme.headingText}`}>Creativity (Temperature)</span>
                          <span className="text-indigo-500 font-mono font-bold">{temperature}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <div className={`flex justify-between text-[10px] ${currentTheme.subtext}`}>
                          <span>0.0 (Precise / Code)</span>
                          <span>1.0 (Creative)</span>
                        </div>
                      </div>

                      <div className={`p-3 sm:p-3.5 rounded-xl ${isDarkActive ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border space-y-2`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${currentTheme.headingText}`}>Context Memory Window</span>
                          <span className="text-indigo-500 font-mono font-bold">{contextTurns} turns</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="20"
                          step="1"
                          value={contextTurns}
                          onChange={(e) => setContextTurns(parseInt(e.target.value, 10))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <div className={`flex justify-between text-[10px] ${currentTheme.subtext}`}>
                          <span>2 turns</span>
                          <span>20 turns</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Directives */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-semibold ${currentTheme.headingText} block`}>
                        Custom Prompt Directives (Appended to System Prompt)
                      </label>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="e.g. Always conclude with 1 actionable recommendation or code snippet..."
                        rows={2}
                        className={`w-full text-xs ${isDarkActive ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-xs'} border rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 resize-none`}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: WORKSPACE VIEWS */}
                {settingsTab === 'views' && (
                  <div className="space-y-3">
                    <div className={`text-xs font-semibold ${currentTheme.headingText}`}>Select Active Workspace View</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('chat');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'chat'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <MessageSquare className={`w-4 h-4 mb-2 ${activeTab === 'chat' ? 'text-blue-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Chat</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>Interactive bot</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('resume');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'resume'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <Brain className={`w-4 h-4 mb-2 ${activeTab === 'resume' ? 'text-indigo-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Resume AI</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>Skill gap detector</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('project');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'project'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <Lightbulb className={`w-4 h-4 mb-2 ${activeTab === 'project' ? 'text-amber-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Project Spec</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>Idea to Project</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('multiturn');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'multiturn'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 mb-2 ${activeTab === 'multiturn' ? 'text-blue-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Test Suite</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>3-turn validator</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('files');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'files'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <FolderCode className={`w-4 h-4 mb-2 ${activeTab === 'files' ? 'text-blue-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Codebase</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>Python files</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('architecture');
                          setIsSettingsOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          activeTab === 'architecture'
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                            : isDarkActive
                            ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <Network className={`w-4 h-4 mb-2 ${activeTab === 'architecture' ? 'text-blue-500' : currentTheme.subtext}`} />
                        <div>
                          <div className={`font-semibold text-xs ${currentTheme.headingText}`}>Architecture</div>
                          <div className={`text-[10px] ${currentTheme.subtext} leading-tight mt-0.5`}>System flow</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: DATA & EXPORTS */}
                {settingsTab === 'data' && (
                  <div className="space-y-3">
                    <div className={`p-3.5 rounded-xl ${isDarkActive ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border space-y-3`}>
                      <div className="text-xs font-semibold flex items-center justify-between">
                        <span className={currentTheme.headingText}>Chat Data & Project Exports</span>
                        <span className={`text-[10px] ${currentTheme.subtext} font-mono`}>{savedSessions.length} Saved Chats</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${isDarkActive ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'} border text-xs font-medium transition-all shadow-xs`}
                          title="Download full python chatbot codebase as ZIP"
                        >
                          <FolderCode className="w-3.5 h-3.5" />
                          Download Project (ZIP)
                        </button>
                        <button
                          type="button"
                          onClick={handleExportJson}
                          disabled={messages.length === 0}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${currentTheme.secondaryBtn} text-xs font-medium transition-all disabled:opacity-40`}
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-500" />
                          Export Current Chat (JSON)
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllSessions}
                          disabled={savedSessions.length === 0}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-medium transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear All Saved Chats
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className={`px-4 sm:px-6 py-3 border-t ${currentTheme.border} ${isDarkActive ? 'bg-slate-900/70' : 'bg-slate-50'} flex items-center justify-between shrink-0`}>
                <span className={`text-[11px] ${currentTheme.subtext}`}>
                  Settings are auto-saved to your local session.
                </span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className={`px-4 py-2 rounded-xl ${currentTheme.accentBtn} text-xs font-medium transition-colors shadow-xs`}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
