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
} from 'lucide-react';

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

const PERSONAS: Record<string, string> = {
  'General Assistant':
    'You are an intelligent, articulate, and context-aware AI Assistant. Always resolve multi-turn references accurately.',
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
  'How do neural networks learn from weights and biases?',
  'Write a Python function for binary search with comments.',
  'What is the difference between supervised and unsupervised learning?',
  'Explain gradient descent using a hiker descending foggy mountains analogy.',
  'How does transformer self-attention work in simple words?',
  'Write a Python script demonstrating memoization with an LRU cache.',
  'What is overfitting in machine learning and how do you prevent it?',
  'Explain backpropagation step by step without dense calculus.',
  'What is reinforcement learning and how is it used in robotics?',
  'Explain the bias-variance tradeoff with a dartboard analogy.',
  'How do Large Language Models predict the next token?',
  'Write a Python generator function to stream large datasets efficiently.',
  'What is transfer learning and why does it save computational power?',
  'Explain convolution in CNNs using an image filter flashlight analogy.',
  'What is the difference between shallow copy and deep copy in Python?',
  'How does semantic search differ from keyword matching search?',
  'Explain latent space embeddings using a 3D library analogy.',
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
  const [activeTab, setActiveTab] = useState<'chat' | 'multiturn' | 'files' | 'architecture'>('chat');
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                Smart Chatbot
              </h2>
              <p className="text-[11px] text-slate-400">LLM API Conversational Engine</p>
            </div>
          </div>
          {isMobile ? (
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs flex items-center justify-between shadow-lg shadow-indigo-600/25 transition-all group shrink-0"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">New</span>
        </button>

        {/* Old Chats / Previous Conversations Section */}
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Previous Chats</span>
            </div>
            {savedSessions.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {savedSessions.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {savedSessions.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 space-y-1 my-2">
                <MessageSquare className="w-5 h-5 text-slate-600 mx-auto mb-1 opacity-70" />
                <p className="text-xs font-medium text-slate-300">No previous chats</p>
                <p className="text-[11px] text-slate-500 leading-snug">
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
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200 shadow-sm'
                        : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/60 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 pr-1 flex-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate leading-tight">
                          {session.title || 'Conversation'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{formatRelativeTime(session.timestamp)}</span>
                          <span>•</span>
                          <span>{session.messages.length} msgs</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all shrink-0"
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
      <div className="pt-3 border-t border-slate-800/80 shrink-0">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs font-medium transition-all group shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:rotate-45 transition-transform duration-200">
              <Settings className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight font-semibold text-white">Settings</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{selectedPersona}</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700/50">
            Open
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090D16] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* DESKTOP SIDEBAR (Visible on md+ screens, fully toggleable) */}
      <AnimatePresence initial={false}>
        {isDesktopSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:flex shrink-0 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex-col justify-between p-4 z-20 overflow-hidden"
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
              className="md:hidden fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-slate-950/95 border-r border-slate-800 p-4 z-50 shadow-2xl flex flex-col justify-between"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* RESPONSIVE TOP HEADER */}
        <header className="h-14 shrink-0 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-10">
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
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center"
              title={isDesktopSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
              aria-label="Toggle Sidebar"
            >
              <span className="hidden md:block">
                {isDesktopSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
                )}
              </span>
              <Menu className="w-4 h-4 md:hidden" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 md:hidden">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-none">
                AI Smart Chatbot
              </span>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeTab !== 'chat' && (
              <button
                onClick={() => setActiveTab('chat')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-all"
                title="Return to Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Chat</span>
              </button>
            )}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all"
              title="New Conversation"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all"
              title="Open Chatbot Settings & Views"
            >
              <Settings className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
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
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-2xl mx-auto my-6 sm:my-12 text-center space-y-4 sm:space-y-6 px-2"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      AI-Powered Smart Chatbot
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                      How can I help you today? Ask a question or select an idea below to get started.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Suggested Prompts</span>
                      </div>
                      <button
                        onClick={handleRefreshPrompts}
                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all font-sans font-medium"
                        title="Shuffle for new random prompts"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>Shuffle</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {suggestions.map((s, idx) => (
                        <motion.button
                          key={s}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSendMessage(s)}
                          className="p-2.5 sm:p-3 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-left text-slate-300 hover:text-white transition-all flex flex-col justify-between group"
                        >
                          <span className="font-semibold text-indigo-400 text-[10px] mb-1 group-hover:text-indigo-300">
                            Idea {idx + 1}
                          </span>
                          <span className="line-clamp-2">{s}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
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
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                        )}

                        <div
                          className={`group relative max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm transition-all ${
                            m.role === 'user'
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-indigo-600/10'
                              : m.error
                              ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200 rounded-tl-sm'
                              : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-tl-sm backdrop-blur-md'
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-sans break-words">{m.content}</div>

                          <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-white/10 text-[10px] opacity-75">
                            <span className="font-mono">{m.timestamp}</span>
                            <div className="flex items-center gap-1.5">
                              {m.model && <span className="font-mono text-cyan-300 hidden sm:inline">{m.model}</span>}
                              <button
                                onClick={() => handleCopy(m.content, m.id)}
                                className="opacity-80 sm:opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5"
                                title="Copy text"
                              >
                                {copiedId === m.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {m.role === 'user' && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-300 shrink-0 border border-slate-700">
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
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-slate-400 text-xs flex items-center gap-2.5">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span className="text-[11px] sm:text-xs">Referencing context & generating response...</span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-2.5 sm:p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 shrink-0">
              <div className="max-w-3xl mx-auto flex items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask a question or continue conversation..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isLoading}
                  className="px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-TURN TEST SUITE */}
        {activeTab === 'multiturn' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  Multi-Turn Context Test
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
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
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
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
                    className="p-3.5 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 sm:space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold font-mono">
                          {item.step}
                        </span>
                        <span className="font-semibold text-xs sm:text-sm text-slate-200">{item.title}</span>
                      </div>
                      {res && (
                        <span
                          className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                            res.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : res.status === 'running'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                              : res.status === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-indigo-300">
                      User: "{item.prompt}"
                    </div>

                    {res?.response && (
                      <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
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
            <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 p-2 sm:p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 md:gap-0">
              <div className="hidden md:block text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-2">
                Project Files
              </div>
              {pythonFiles.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`whitespace-nowrap px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs font-mono flex items-center gap-1.5 md:gap-2 transition-all ${
                    activeFileIndex === idx
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}

              <div className="md:pt-4 md:border-t md:border-slate-800 md:mt-4 shrink-0">
                <button
                  onClick={runPyTestOnBackend}
                  disabled={isPyTestRunning}
                  className="whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 md:py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-indigo-300 border border-indigo-500/30 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5 shrink-0" />
                  {isPyTestRunning ? 'Running...' : 'Run python test'}
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <div className="h-10 sm:h-11 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between text-xs font-mono text-slate-400 gap-2 shrink-0 bg-slate-950/80">
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate font-semibold text-slate-200">
                    {pythonFiles[activeFileIndex]?.name || 'Loading...'}
                  </span>
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {pythonFiles[activeFileIndex]?.language || 'code'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleDownloadCurrentFile}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-sans flex items-center gap-1 transition-colors"
                    title="Download this file"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  <button
                    onClick={handleDownloadZip}
                    className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 text-[11px] font-sans flex items-center gap-1 transition-colors"
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
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-sans flex items-center gap-1 transition-colors"
                    title="Copy code to clipboard"
                  >
                    {copiedId === pythonFiles[activeFileIndex]?.name ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3 sm:p-4">
                <pre className="text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                  <code>{pythonFiles[activeFileIndex]?.content}</code>
                </pre>
              </div>

              {pyTestOutput && (
                <div className="h-36 sm:h-44 border-t border-slate-800 bg-slate-950/95 p-3 overflow-auto font-mono text-[11px] text-emerald-400">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center justify-between">
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
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-400" />
                Smart Chatbot System Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-1">
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
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800"
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${node.color} flex items-center justify-center text-white shrink-0 shadow-md font-bold font-mono text-xs sm:text-sm`}
                  >
                    {node.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-200 truncate">{node.label}</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{node.desc}</p>
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
              className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/70 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-white">
                      Chatbot Settings & Configuration
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Configure models, personas, system instructions & workspace tools
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-slate-300">
                {/* 1. Project Workspace Views */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Workspace Views & Tools
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Select active mode</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        setIsSettingsOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        activeTab === 'chat'
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <MessageSquare className={`w-4 h-4 mb-2 ${activeTab === 'chat' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Chat</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Interactive bot</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('multiturn');
                        setIsSettingsOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        activeTab === 'multiturn'
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 mb-2 ${activeTab === 'multiturn' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Test Suite</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">3-turn validator</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('files');
                        setIsSettingsOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        activeTab === 'files'
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <FolderCode className={`w-4 h-4 mb-2 ${activeTab === 'files' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Codebase</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Python files</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('architecture');
                        setIsSettingsOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        activeTab === 'architecture'
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <Network className={`w-4 h-4 mb-2 ${activeTab === 'architecture' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-semibold text-xs text-white">Architecture</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">System flow</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Model Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    LLM Model Architecture
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Recommended - Fastest & Low Latency)</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Standard Multimodal Intelligence)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest (General Fast Inference)</option>
                    <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview (Next-Gen Preview)</option>
                  </select>
                </div>

                {/* 3. System Persona & Live Prompt Display */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    Chatbot Persona & System Prompt
                  </label>
                  <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.keys(PERSONAS).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                    "{PERSONAS[selectedPersona]}"
                  </div>
                </div>

                {/* 4. Sliders: Temperature & Context Turns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">Creativity (Temperature)</span>
                      <span className="text-indigo-400 font-mono font-bold">{temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0.0 (Precise / Code)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">Context Memory Window</span>
                      <span className="text-indigo-400 font-mono font-bold">{contextTurns} turns</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={contextTurns}
                      onChange={(e) => setContextTurns(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>2 turns</span>
                      <span>20 turns</span>
                    </div>
                  </div>
                </div>

                {/* 5. Custom Directives */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Custom Prompt Directives (Appended to System Prompt)
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Always conclude with 1 actionable recommendation or code snippet..."
                    rows={2}
                    className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* 6. Chat History & Data Controls + Project ZIP */}
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Chat Data & Project Exports</span>
                    <span className="text-[10px] text-slate-400 font-mono">{savedSessions.length} Saved Chats</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleDownloadZip}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 text-xs font-medium transition-all shadow-sm"
                      title="Download full python chatbot codebase as ZIP"
                    >
                      <FolderCode className="w-3.5 h-3.5" />
                      Download Project (ZIP)
                    </button>
                    <button
                      onClick={handleExportJson}
                      disabled={messages.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-all disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Export Current Chat (JSON)
                    </button>
                    <button
                      onClick={handleClearAllSessions}
                      disabled={savedSessions.length === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-medium transition-all disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All Saved Chats
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500">
                  Settings are auto-saved to your local session.
                </span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-md shadow-indigo-600/20"
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
