import React, { useRef, useEffect } from 'react';
import { Paperclip, Send, Loader2, File, AlertCircle, X } from 'lucide-react';
import { translations, Language } from '../lib/translations';

interface InputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  activeDocName: string | null;
  activeDocStatus: 'processing' | 'processed' | 'error' | null;
  hasFile: boolean;
  onFileUpload: (file: File) => void;
  onCancelFile?: () => void;
  uploading: boolean;
  isAnalyzing: boolean;
  analyzerError: string | null;
  lang: Language;
}

export default function InputBar({
  value,
  onChange,
  onSubmit,
  activeDocName,
  activeDocStatus,
  hasFile,
  onFileUpload,
  onCancelFile,
  uploading,
  isAnalyzing,
  analyzerError,
  lang
}: InputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[lang || 'id'];

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isAnalyzing && (!hasFile || activeDocStatus === 'processed')) {
        onSubmit();
      }
    }
  };

  // Auto-expand raw height calculation
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Calculate scrollHeight up to max-height (approx 5 lines ~ 120px)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const isDisabled = isAnalyzing || !value.trim() || (hasFile && activeDocStatus !== 'processed');

  return (
    <div id="sticky-input-bar" className="sticky bottom-0 bg-white dark:bg-black border-t border-slate-200 dark:border-zinc-800 px-4 py-4 md:py-5 shadow-sm">
      <div className="max-w-4xl mx-auto space-y-2.5">
        
        {/* Document Context Chip & Errors layer */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hasFile && activeDocName ? (
            <div id="active-doc-chip" className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-805 rounded-full py-1 px-2.5">
              <File className="h-3 w-3 text-blue-900 dark:text-blue-400 shrink-0" />
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px] font-sans">
                {activeDocName}
              </span>
              <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                activeDocStatus === 'processed' 
                   ? 'bg-green-500' 
                   : activeDocStatus === 'processing' 
                   ? 'bg-amber-500 animate-pulse' 
                   : 'bg-red-500'
              }`} />
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                {activeDocStatus === 'processed' 
                  ? t.activeDocReady 
                  : activeDocStatus === 'processing' 
                  ? t.activeDocParsing 
                  : t.activeDocError}
              </span>
              {onCancelFile && (
                <button
                  type="button"
                  id="btn-cancel-file-upload"
                  onClick={onCancelFile}
                  className="p-0.5 ml-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-450 hover:text-red-550 dark:hover:text-red-400 cursor-pointer focus:outline-none transition-colors shrink-0 flex items-center justify-center"
                  title={lang === 'id' ? "Hapus / Batalkan Dokumen" : "Remove / Cancel Document"}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <span id="no-doc-hint" className="text-[10px] text-slate-400 dark:text-slate-500 font-sans flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="h-3 w-3 text-blue-550 dark:text-blue-450 shrink-0 animate-pulse" />
              <span>{t.noDocHint}</span>
            </span>
          )}

          {/* Miniature inline status indicator */}
          {isAnalyzing && (
            <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-400 text-[10px] font-mono tracking-wider animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t.analyzingDocs}</span>
            </div>
          )}
        </div>

        {/* Floating Input Group */}
        <div id="input-control-box" className="relative flex items-end gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus-within:border-slate-300 dark:focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-slate-300/40 p-1.5 transition-shadow">
          
          {/* File Picker Toggle */}
          <button
            id="input-paperclip"
            onClick={handlePaperclipClick}
            disabled={uploading}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 shrink-0 cursor-pointer"
            title={t.attachTitle}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.docx,.xlsx,.csv"
          />

          {/* Query Typing Canvas */}
          <textarea
            id="query-textarea"
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={(hasFile && activeDocStatus !== 'processed') || isAnalyzing}
            placeholder={
              hasFile
                ? activeDocStatus === 'processed' 
                  ? t.placeholderReady 
                  : activeDocStatus === 'processing'
                  ? t.placeholderProcessing
                  : t.placeholderNoDoc
                : t.placeholderNoDoc
            }
            className="flex-1 w-full bg-transparent text-slate-800 dark:text-slate-101 text-xs py-2 px-1 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 resize-none font-sans max-h-32 min-h-[36px]"
          />

          {/* Action Trigger button */}
          <button
            id="btn-analyze-query"
            onClick={onSubmit}
            disabled={isDisabled}
            className="p-2 rounded-lg bg-blue-900 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-700 focus:ring-1 focus:ring-offset-1 focus:ring-blue-900 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed shrink-0 transition-colors shadow-sm cursor-pointer"
            title={t.btnSendTitle}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Error notifications tray */}
        {(analyzerError || activeDocStatus === 'error') && (
          <div id="tray-error-notice" className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-sans select-none animate-fadeIn">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span id="err-text-notice">
              {analyzerError || t.errorMessageNotice}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
