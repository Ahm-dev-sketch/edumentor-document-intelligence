import React, { useRef } from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  Settings, 
  X, 
  FolderOpen, 
  BookOpen, 
  Loader2, 
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { DocumentItem, AnalysisStyle } from '../types';
import { translations, Language } from '../lib/translations';

interface SidebarProps {
  documents: DocumentItem[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  analysisStyle: AnalysisStyle;
  onAnalysisStyleChange: (style: AnalysisStyle) => void;
  onFileUpload: (file: File) => void;
  uploading: boolean;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  activeUser: string;
  userDisplayName?: string;
  onOpenSettings?: () => void;
  onNewChat: () => void;
  lang: Language;
  messagesCount?: number;
}

export default function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteDocument,
  analysisStyle,
  onAnalysisStyleChange,
  onFileUpload,
  uploading,
  isOpenMobile,
  setIsOpenMobile,
  activeUser,
  userDisplayName = '',
  onOpenSettings,
  onNewChat,
  lang,
  messagesCount = 0
}: SidebarProps) {
  const [docToDelete, setDocToDelete] = React.useState<DocumentItem | null>(null);
  const t = translations[lang || 'id'];

  // Group files into "Today" and "Earlier"
  const isTodayDate = (dateString: string) => {
    try {
      const today = new Date();
      const itemDate = new Date(dateString);
      return (
        today.getDate() === itemDate.getDate() &&
        today.getMonth() === itemDate.getMonth() &&
        today.getFullYear() === itemDate.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Filter out blank general chat sessions that do not have any messages yet (to avoid duplicates/clutter)
  const hasHistoryOrFile = (doc: DocumentItem) => {
    if (doc.id === activeDocumentId) return true;
    if (doc.size > 0) return true;
    try {
      const stored = localStorage.getItem(`chat_history_${doc.id}`);
      if (stored) {
        const msgs = JSON.parse(stored);
        return msgs.length > 0;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const filteredDocs = documents.filter(hasHistoryOrFile);

  const todayDocs = filteredDocs.filter(doc => isTodayDate(doc.createdAt));
  const earlierDocs = filteredDocs.filter(doc => !isTodayDate(doc.createdAt));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderDocumentList = (docsList: DocumentItem[], emptyLabel: string) => {
    if (docsList.length === 0) {
      return (
        <p id="docs-empty-label" className="text-xs text-slate-400 dark:text-zinc-500 font-sans italic px-3 py-2">
          {emptyLabel}
        </p>
      );
    }

    return (
      <ul className="space-y-1">
        {docsList.map(doc => {
          const isActive = doc.id === activeDocumentId;

          // Determine friendly display name from first user question in localStorage history if available
          let displayName = doc.name;
          if (doc.size === 0 || doc.name === "Obrolan Baru" || doc.name === "Obrolan Umum") {
            try {
              const stored = localStorage.getItem(`chat_history_${doc.id}`);
              if (stored) {
                const msgs = JSON.parse(stored);
                const firstUserMsg = msgs.find((m: any) => m.role === 'user');
                if (firstUserMsg && firstUserMsg.parts && firstUserMsg.parts[0]?.text) {
                  displayName = firstUserMsg.parts[0].text;
                }
              }
            } catch (e) {
              // ignore
            }
          }

          const hasFile = doc.size > 0;

          return (
            <li 
              key={doc.id}
              id={`doc-item-${doc.id}`}
              className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm select-none transition-all duration-205 border border-transparent ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50/95 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border-blue-100/90 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 font-semibold shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/85 hover:text-slate-850 dark:hover:text-slate-100'
              }`}
            >
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                onClick={() => onSelectDocument(doc.id)}
              >
                {hasFile ? (
                  <FileText className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-650 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                ) : (
                  <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-650 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs leading-none mb-1 font-sans">{displayName}</p>
                  <p className={`text-[10px] leading-tight ${isActive ? 'text-blue-500/80 dark:text-blue-450/80' : 'text-slate-400 dark:text-zinc-500'}`}>
                    {hasFile ? formatSize(doc.size) : t.aiConvText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {/* Embedded dynamic badge status */}
                {doc.status === 'processing' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" title="Processing file..." />
                )}
                {doc.status === 'error' && (
                  <span title="Error parsing document.">
                    <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                  </span>
                )}
                
                <button
                  id={`delete-doc-${doc.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocToDelete(doc);
                  }}
                  className={`p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500/10 transition-all cursor-pointer ${
                    isActive ? 'text-blue-500 dark:text-blue-450 hover:text-red-650' : 'text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                  title={t.deleteTooltip}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-black border-r border-slate-200 dark:border-zinc-800 shadow-sm">
      {/* Upper header section */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-900 dark:text-blue-400 shrink-0" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight font-sans">EduMentor Intelligence</h2>
        </div>
        {isOpenMobile && (
          <button 
            id="close-sidebar-mobile"
            onClick={() => setIsOpenMobile(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-slate-400 lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main interaction section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* New Chat trigger */}
        <button
          id="btn-new-chat-sidebar"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-550 hover:to-indigo-550 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-650 dark:hover:to-indigo-650 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-0.5px] active:translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer font-sans"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>{t.newChatBtn}</span>
        </button>

        {/* Dynamic Analysis Preset dropdown */}
        <div id="analysis-style-panel" className="space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            {t.analysisStyleLabel}
          </label>
          <div className="relative">
            <select
              id="analysis-style-dropdown"
              value={analysisStyle}
              onChange={(e) => onAnalysisStyleChange(e.target.value as AnalysisStyle)}
              className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-750 dark:text-slate-200 text-xs rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-900/50 cursor-pointer font-sans"
            >
              <option value="conversational" className="dark:bg-black">{t.conversationalOption}</option>
              <option value="formal" className="dark:bg-black">{t.formalOption}</option>
            </select>
          </div>
        </div>

        {/* History Group 1: Today */}
        <div id="group-today" className="space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            {t.todayGroup}
          </span>
          {renderDocumentList(todayDocs, t.noDocsToday)}
        </div>

        {/* History Group 2: Earlier */}
        <div id="group-earlier" className="space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            {t.earlierGroup}
          </span>
          {renderDocumentList(earlierDocs, t.noDocsEarlier)}
        </div>
      </div>

      {/* Persistent Applet settings/user credits */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/20">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-blue-950 dark:bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
              {(userDisplayName || activeUser).substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-700 dark:text-zinc-350 truncate font-sans">
                {userDisplayName || activeUser}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-none font-mono">{t.activeWorkspace}</p>
            </div>
          </div>
          <button
            id="btn-sidebar-settings"
            onClick={onOpenSettings}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer focus:outline-none transition-colors shrink-0"
            title={lang === 'id' ? "Pengaturan Akun" : "Account Settings"}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed Left rail list */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 h-full shrink-0 z-25">
        {sidebarContent}
      </aside>

      {/* Mobile drawer with backdrop shield */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-150 bg-slate-950/60 ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpenMobile(false)}
      >
        <div 
          className={`fixed left-0 top-0 bottom-0 w-64 h-full transition-transform duration-150 z-50 ${
            isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </div>
      </div>

      {docToDelete && (
        <div 
          id="confirm-delete-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div 
            id="confirm-delete-modal"
            className="w-full max-w-sm bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl text-center transform scale-100 transition-all duration-200"
          >
            {/* Warning triangle avatar */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>

            {/* Warning Message Title */}
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-101 mb-2 font-sans">
              {t.confirmDeleteTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mb-6 font-sans">
              {t.confirmDeleteDesc.replace('{name}', docToDelete.name)}
            </p>

            {/* Custom CTA Actions buttons */}
            <div className="flex items-center gap-3">
              <button
                id="btn-cancel-delete"
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                {t.btnCancel}
              </button>
              <button
                id="btn-confirm-delete"
                onClick={() => {
                  onDeleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {t.btnConfirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
