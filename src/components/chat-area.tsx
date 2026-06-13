import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Bot, 
  User, 
  FileText, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Loader2,
  Search,
  Brain,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ChatMessage } from '../types';
import ChartRenderer from './chart-renderer';
import { translations, Language } from '../lib/translations';

// Helper to extract JSON charts from markdown strings.
function parseMessageContent(text: string) {
  const codeBlockRegex = /```json\s*({[\s\S]*?})\s*```/g;
  const match = codeBlockRegex.exec(text);

  if (match) {
    try {
      const cleanJson = match[1].trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.chartData)) {
        // Strip out the JSON block from text content
        const textWithoutJson = text.replace(match[0], '').trim();
        return {
          displayMarkdown: textWithoutJson,
          chart: {
            chartData: parsed.chartData,
            chartType: parsed.chartType || 'bar',
            xAxisKey: parsed.xAxisKey || 'label',
            yAxisKey: parsed.yAxisKey || 'value',
            title: parsed.title || 'Data Insights'
          }
        };
      }
    } catch (error) {
      // Falls through to default return if JSON failed to parse
    }
  }

  return { displayMarkdown: text, chart: null };
}

// Custom Gemini-style Thinking/Analyzing Step cycling component with Phantom load lines
function ThinkingState({ lang }: { lang: Language }) {
  const t = translations[lang || 'id'];
  const steps = [
    { text: t.thinkingRead, icon: Search },
    { text: t.thinkingBrain, icon: Brain },
    { text: t.thinkingTrend, icon: TrendingUp },
    { text: t.thinkingBook, icon: BookOpen },
    { text: t.thinkingFinal, icon: FileCheck }
  ];
  
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  const CurrentIcon = steps[currentStep] ? steps[currentStep].icon : Search;
  const currentText = steps[currentStep] ? steps[currentStep].text : "";

  return (
    <div className="flex flex-col gap-4 py-2 font-sans">
      {/* Active step indication */}
      <div className="flex items-center gap-2.5 text-slate-500 dark:text-zinc-400">
        <CurrentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
        <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
          {currentText}
        </span>
      </div>
      
      {/* Beautiful Phantom Load list representing upcoming paragraphs */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-full bg-slate-100 dark:bg-zinc-900 rounded-md animate-pulse" />
        <div className="h-3 w-[92%] bg-slate-100 dark:bg-zinc-900 rounded-md animate-pulse [animation-delay:0.2s]" />
        <div className="h-3 w-[85%] bg-slate-100 dark:bg-zinc-900 rounded-md animate-pulse [animation-delay:0.4s]" />
        <div className="h-3 w-[40%] bg-slate-100 dark:bg-zinc-900 rounded-md animate-pulse [animation-delay:0.6s]" />
      </div>

      {/* Bounce pulsing indicator dots */}
      <div className="flex items-center gap-1.5 pl-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-450 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-blue-450 dark:bg-blue-600 animate-bounce" />
      </div>
    </div>
  );
}

// React.memo to prevent unnecessary re-renders of list items while user is typing.
const MessageCard = React.memo(({ message, lang, isGenerating }: { message: ChatMessage; lang: Language; isGenerating?: boolean }) => {
  const isModel = message.role === 'model';
  const { displayMarkdown, chart } = parseMessageContent(message.parts[0].text);
  const isEmpty = isModel && !displayMarkdown;

  return (
    <div 
      id={`msg-card-${message.id}`} 
      className={`flex gap-3 mb-6 max-w-4xl animate-fadeIn ${isModel ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
    >
      {/* Icon frame with linear gradient glow */}
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border shadow-md transition-all duration-300 ${
        isModel 
          ? 'bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-zinc-800 scale-100 hover:scale-105' 
          : 'bg-gradient-to-tr from-slate-100 to-slate-250 dark:from-zinc-900 dark:to-zinc-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-800'
      }`}>
        {isModel ? <Bot className="h-5 w-5 animate-pulse" /> : <User className="h-4.5 w-4.5" />}
      </div>

      {/* Message Box */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Speaker Indicator Label */}
        <div className={`flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-zinc-500 ${!isModel && 'justify-end'}`}>
          <span>{isModel ? 'EduMentor AI' : (lang === 'id' ? 'Anda' : 'You')}</span>
          {isModel && <span className="h-1 w-1 rounded-full bg-blue-500" />}
        </div>

        <div id={`msg-bubble-${message.id}`} className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed transition-shadow duration-300 ${
          isModel 
            ? 'bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-900/80 text-slate-800 dark:text-slate-100 shadow-sm hover:shadow-md rounded-tl-sm' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 text-white shadow-md rounded-tr-sm text-left'
        }`}>
          {isModel ? (
            isEmpty ? (
              <ThinkingState lang={lang} />
            ) : (
              <div className="markdown-body prose max-w-none text-slate-800 dark:text-slate-100 break-words prose-slate dark:prose-invert text-xs space-y-1">
                <Markdown>{displayMarkdown}</Markdown>
                {isGenerating && (
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100/50 dark:border-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-sans">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400"></span>
                    </span>
                    <span className="animate-pulse">{translations[lang || 'id'].typingIndicator}</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <p className="whitespace-pre-wrap text-left text-xs font-sans text-white leading-relaxed">{displayMarkdown}</p>
          )}

          {/* Render charts if matching specifications */}
          {!isEmpty && chart && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-900/70">
              <ChartRenderer 
                chartData={chart.chartData}
                chartType={chart.chartType as any}
                xAxisKey={chart.xAxisKey}
                yAxisKey={chart.yAxisKey}
                title={chart.title}
              />
            </div>
          )}
        </div>
        <p className={`text-[9px] text-slate-400 dark:text-zinc-500 mt-1 font-mono tracking-wider ${!isModel && 'text-right'}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
});

interface ChatAreaProps {
  messages: ChatMessage[];
  loadingHistory: boolean;
  activeDocName: string | null;
  emptyStateTitle: string;
  emptyStateText: string;
  lang: Language;
  isAnalyzing?: boolean;
  onSuggestionClick?: (prompt: string) => void;
}

export default function ChatArea({
  messages,
  loadingHistory,
  activeDocName,
  emptyStateTitle,
  emptyStateText,
  lang,
  isAnalyzing = false,
  onSuggestionClick
}: ChatAreaProps) {

  const t = translations[lang || 'id'];

  // Educational Prompt suggestions for instant bento clicking
  const suggestionPrompts = lang === 'id' 
    ? [
        {
          title: "Sederhanakan Materi",
          desc: "Jelaskan konsep tersulit dengan analogi kehidupan nyata.",
          prompt: "Tolong jelaskan materi pelajaran tersulit di sini dengan bahasa yang sangat sederhana, analogi visual, serta contoh kehidupan nyata agar saya gampang memahaminya.",
          icon: Brain,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
        },
        {
          title: "Buat Ringkasan Bab",
          desc: "Ekstrak intisari poin penting & rumus-rumus esensial.",
          prompt: "Buatkan saya ringkasan komprehensif, poin-poin penting pelajaran, serta daftar rumus atau definisi esensial yang wajib saya hafal dari topik ini.",
          icon: BookOpen,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
        },
        {
          title: "Latihan Soal Kuis",
          desc: "Uji pemahaman Anda dengan kuis interaktif buatan AI.",
          prompt: "Buatkan saya kuis latihan singkat berisi 5 soal pilihan ganda interaktif beserta kunci pembahasan lengkap untuk menguji tingkat pemahaman saya.",
          icon: HelpCircle,
          color: "text-green-500 bg-green-50 dark:bg-green-950/20"
        },
        {
          title: "Sajikan Grafik Visual",
          desc: "Minta AI menganalisis tren data dan menggambar chart.",
          prompt: "Tolong buatkan saya visualisasi grafik bagan data angka interaktif. Berikan analisis tren dari statistik angka tersebut menggunakan kode JSON chart.",
          icon: Sparkles,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
        }
      ]
    : [
        {
          title: "Simplify Difficult Core",
          desc: "Explain complex concepts using easy real-life analogies.",
          prompt: "Please explain the most complex scientific or mathematical concept in this subject using simple language, visual analogies, and concrete examples.",
          icon: Brain,
          color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
        },
        {
          title: "Generate Chapter Summary",
          desc: "Extract key takeaways, core findings, and formulas.",
          prompt: "Create a structured, comprehensive chapter synthesis showing key takeaways, core findings, and essential terminology/formulas I must remember.",
          icon: BookOpen,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
        },
        {
          title: "Practice Mock Quiz",
          desc: "Test your study mastery with 5 quick practice questions.",
          prompt: "Compile a 5-question multiple choice practice quiz based on this educational topic, including detailed step-by-step answers and explanations.",
          icon: HelpCircle,
          color: "text-green-500 bg-green-50 dark:bg-green-950/20"
        },
        {
          title: "Generate Visual Charts",
          desc: "Ask AI to analyze patterns and render dynamic plots.",
          prompt: "Please construct a visual statistical graph bar representation of numerical data trends, paired with explanatory text analysis and formatted JSON charts.",
          icon: Sparkles,
          color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
        }
      ];

  if (loadingHistory) {
    // Premium multi-line conversational Phantom Load skeletons
    return (
      <div id="chat-loading-skeleton" className="flex-1 overflow-y-auto px-4 pt-20 pb-6 space-y-6 bg-slate-50 dark:bg-black scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-6">
          {[1, 2, 3].map(ind => {
            const isRight = ind % 2 === 0;
            return (
              <div 
                key={ind} 
                className={`flex gap-3 max-w-2xl ${isRight ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar circle skeleton */}
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                
                {/* Bubble card structure */}
                <div className="flex-1 space-y-2.5">
                  <div className={`p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 space-y-2 animate-pulse ${
                    isRight ? 'rounded-tr-none bg-slate-100/50 dark:bg-zinc-900/30' : 'rounded-tl-none'
                  }`}>
                    {/* Multi-tier random line widths for authentic content skeleton representation */}
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-[85%]" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-[60%]" />
                    {ind === 1 && (
                      <div className="h-3 bg-slate-100 dark:bg-zinc-900 rounded-md w-[45%] pt-1" />
                    )}
                  </div>
                  {/* Small subtext skeleton for timestamp */}
                  <div className={`h-2 bg-slate-200/60 dark:bg-zinc-800 rounded-sm w-12 animate-pulse ${
                    isRight ? 'ml-auto' : ''
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    // Beautiful interactive bento layout empty state
    return (
      <div id="chat-empty-state" className="flex-1 overflow-y-auto px-4 pt-20 pb-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-black relative select-none">
        {/* Ambient background glow effect */}
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-400/5 blur-3xl pointer-events-none" />

        <div className="max-w-3xl w-full flex flex-col items-center text-center relative z-10 py-6 px-2">
          {/* Pulsing visual logo */}
          <div className="relative group mb-6">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-md group-hover:opacity-45 transition duration-500 pointer-events-none"></div>
            <div className="relative h-14 w-14 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center shadow-md text-blue-600 dark:text-blue-400">
              <Bot className="h-7 w-7 animate-pulse" />
            </div>
          </div>

          <h3 id="empty-title" className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 font-sans tracking-tight">
            {activeDocName ? `${lang === 'id' ? 'Interaksi Berkas' : 'Document Q&A'}: ${activeDocName}` : t.emptyStateTitle}
          </h3>
          <p id="empty-desc" className="text-xs text-slate-500 dark:text-zinc-400 max-w-lg mb-8 leading-relaxed font-sans">
            {activeDocName 
              ? t.readyDocDesc 
              : t.emptyStateDesc}
          </p>

          {/* Interactive Bento Capsule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
            {suggestionPrompts.map((sug, index) => {
              const SugIcon = sug.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSuggestionClick && onSuggestionClick(sug.prompt)}
                  className="group bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-900 hover:border-blue-500/85 dark:hover:border-blue-500/70 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 text-left transition-all duration-300 cursor-pointer flex gap-3 focus:outline-none"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${sug.color} group-hover:scale-105 transition-transform`}>
                    <SugIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5 font-sans group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                      <span>{sug.title}</span>
                      <span className="opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all font-mono text-[10px] ml-1">→</span>
                    </h4>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-sans leading-normal line-clamp-2">
                      {sug.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="chat-scroller" className="flex-1 overflow-y-auto px-4 pt-20 pb-6 bg-slate-50 dark:bg-black scroll-smooth">
      {/* Messages layout container */}
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message, idx) => {
          const isLast = idx === messages.length - 1;
          const isGenerating = isAnalyzing && isLast && message.role === 'model';
          return (
            <MessageCard 
              key={message.id} 
              message={message} 
              lang={lang} 
              isGenerating={isGenerating} 
            />
          );
        })}
      </div>
    </div>
  );
}
