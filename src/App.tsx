import React, { useState, useEffect, useRef } from 'react';
import { Menu, BookOpen, LogOut, ChevronRight, RefreshCw, FileText, Globe, Sun, Moon, User, Key, Settings, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { DocumentItem, ChatMessage, AnalysisStyle } from './types';
import Sidebar from './components/sidebar';
import ChatArea from './components/chat-area';
import InputBar from './components/input-bar';
import LoginView from './components/login-view';
import { Language, translations } from './lib/translations';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('edumentor_user_email');
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('edumentor_dark_mode') === 'true';
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string>(() => {
    return localStorage.getItem('edumentor_user_display_name') || '';
  });
  const [userPassword, setUserPassword] = useState<string>(() => {
    return localStorage.getItem('edumentor_user_password') || 'password123';
  });

  const [tempDisplayName, setTempDisplayName] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('edumentor_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('edumentor_dark_mode', 'false');
    }
  }, [darkMode]);

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const local = localStorage.getItem('edumentor_documents_catalog');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(() => {
    return localStorage.getItem('edumentor_active_document_id');
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [queryInput, setQueryInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [analysisStyle, setAnalysisStyle] = useState<AnalysisStyle>(() => {
    return (localStorage.getItem('edumentor_analysis_style') as AnalysisStyle) || 'formal';
  });
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('edumentor_language') as Language) || 'id';
  });

  useEffect(() => {
    localStorage.setItem('edumentor_language', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('edumentor_analysis_style', analysisStyle);
  }, [analysisStyle]);

  // Synchronize activeDocumentId with localStorage
  useEffect(() => {
    if (activeDocumentId) {
      localStorage.setItem('edumentor_active_document_id', activeDocumentId);
    } else {
      localStorage.removeItem('edumentor_active_document_id');
    }
  }, [activeDocumentId]);

  // Synchronize documents state with local storage to endure container scale-downs
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('edumentor_documents_catalog', JSON.stringify(documents));
    }
  }, [documents]);

  // Dynamically auto-select the latest document session if none is active
  useEffect(() => {
    if (documents.length > 0) {
      if (!activeDocumentId) {
        setActiveDocumentId(documents[0].id);
      } else if (!documents.some(d => d.id === activeDocumentId)) {
        setActiveDocumentId(documents[0].id);
      }
    }
  }, [documents, activeDocumentId]);

  const activeDoc = documents.find(d => d.id === activeDocumentId) || null;

  // Helper to safely perform fetch and avoid Unexpected Token '<' HTML parsing errors
  const safeFetch = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      if (isJson) {
        try {
          const errPayload = await response.json();
          throw new Error(errPayload.error || `Server error (${response.status})`);
        } catch {
          throw new Error(`Server returned error status ${response.status}`);
        }
      } else {
        const textFallback = await response.text();
        if (textFallback.startsWith('<!doctype') || textFallback.startsWith('<!DOCTYPE') || textFallback.includes('<html')) {
          throw new Error(`Koneksi server gagal (${response.status}). Mohon tunggu sebentar selagi server selesai dimuat ulang.`);
        }
        throw new Error(textFallback.substring(0, 150) || `Server error (${response.status})`);
      }
    }

    if (isJson) {
      try {
        return await response.json();
      } catch {
        throw new Error("Gagal mengurai respon data JSON dari server.");
      }
    } else {
      const text = await response.text();
      if (text.startsWith('<!doctype') || text.startsWith('<!DOCTYPE') || text.includes('<html')) {
        throw new Error("Server sedang memuat ulang. Silakan klik tombol sinkronisasi atau coba lagi dalam beberapa detik.");
      }
      throw new Error("Server mengirimkan respon non-JSON.");
    }
  };

  const lastLoadedDocIdRef = useRef<string | null>(null);

  // Retrieve initial list of document metadata
  const fetchDocuments = async () => {
    try {
      const data: DocumentItem[] = await safeFetch('/api/documents');
      if (data) {
        // Merge with client-side local cache to be resilient to server restarts
        const localStr = localStorage.getItem('edumentor_documents_catalog') || '[]';
        let localDocs: DocumentItem[] = [];
        try {
          localDocs = JSON.parse(localStr);
        } catch {
          localDocs = [];
        }

        const mergedMap = new Map<string, DocumentItem>();
        // Populate local documents first
        localDocs.forEach(d => mergedMap.set(d.id, d));
        // Server documents overwrite local ones (since server side is source of truth for files)
        data.forEach(d => mergedMap.set(d.id, d));

        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setDocuments(mergedList);
        localStorage.setItem('edumentor_documents_catalog', JSON.stringify(mergedList));
      }
    } catch (err) {
      console.error("Failed fetching documents:", err);
      // Fallback to local storage if server fetch fails or is loading
      try {
        const localStr = localStorage.getItem('edumentor_documents_catalog');
        if (localStr) {
          setDocuments(JSON.parse(localStr));
        }
      } catch {
        // ignore
      }
    }
  };

  // Run on log-in or initial mount
  useEffect(() => {
    if (userEmail) {
      fetchDocuments();
    }
  }, [userEmail]);

  // Load chat history specific to the active document from local storage
  useEffect(() => {
    if (activeDocumentId) {
      lastLoadedDocIdRef.current = activeDocumentId;
      const stored = localStorage.getItem(`chat_history_${activeDocumentId}`);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      lastLoadedDocIdRef.current = null;
      setMessages([]);
    }
  }, [activeDocumentId]);

  // Persist chat history changes locally (guarded against switching race conditions)
  useEffect(() => {
    if (activeDocumentId && activeDocumentId === lastLoadedDocIdRef.current) {
      if (messages.length > 0) {
        localStorage.setItem(`chat_history_${activeDocumentId}`, JSON.stringify(messages));
      } else {
        localStorage.removeItem(`chat_history_${activeDocumentId}`);
      }
    }
  }, [messages]);

  const handleLoginSuccess = (email: string) => {
    localStorage.setItem('edumentor_user_email', email);
    setUserEmail(email);
    // Auto-initialize name if empty
    if (!localStorage.getItem('edumentor_user_display_name')) {
      const defaultName = email.split('@')[0];
      localStorage.setItem('edumentor_user_display_name', defaultName);
      setUserDisplayName(defaultName);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('edumentor_user_email');
    setUserEmail(null);
    setActiveDocumentId(null);
    setDocuments([]);
    setMessages([]);
  };

  const handleLogoutClick = () => {
    Swal.fire({
      title: lang === 'id' ? 'Konfirmasi Keluar' : 'Sign Out Confirmation',
      text: lang === 'id' ? 'Apakah Anda yakin ingin keluar dari sesi EduMentor?' : 'Are you sure you want to sign out from your EduMentor session?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#ef4444',
      confirmButtonText: lang === 'id' ? 'Ya, Keluar' : 'Yes, Sign Out',
      cancelButtonText: lang === 'id' ? 'Batal' : 'Cancel',
      background: darkMode ? '#18181b' : '#ffffff',
      color: darkMode ? '#f4f4f5' : '#18181b',
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout();
      }
    });
  };

  const handleCancelFile = async () => {
    if (!activeDocumentId) return;

    Swal.fire({
      title: lang === 'id' ? 'Batalkan / Hapus Lampiran Berkas?' : 'Remove File Attachment?',
      text: lang === 'id'
        ? 'Apakah Anda yakin ingin melepas lampiran berkas dari obrolan ini? Seluruh riwayat percakapan Anda dengan EduMentor akan tetap aman disimpan.'
        : 'Are you sure you want to remove the file attachment from this chat? All of your conversation history with EduMentor will remain safely preserved.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e3a8a',
      cancelButtonColor: '#64748b',
      confirmButtonText: lang === 'id' ? 'Ya, Lepas Berkas' : 'Yes, Remove File',
      cancelButtonText: lang === 'id' ? 'Batal' : 'Cancel',
      background: darkMode ? '#18181b' : '#ffffff',
      color: darkMode ? '#f4f4f5' : '#18181b',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsAnalyzing(true);
          // Detach document attachment on backend to keep chat histories alive
          const updatedDoc = await safeFetch(`/api/documents/detach/${activeDocumentId}`, {
            method: 'POST',
          });

          if (updatedDoc) {
            setDocuments(prev => prev.map(d => d.id === activeDocumentId ? updatedDoc : d));
          }

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: lang === 'id' ? 'Berkas berhasil dilepas' : 'File successfully detached',
            showConfirmButton: false,
            timer: 1500,
            background: darkMode ? '#27272a' : '#ffffff',
            color: darkMode ? '#f4f4f5' : '#18181b',
          });
        } catch (err: any) {
          console.error(err);
          setAnalyzerError(err.message || "Gagal membatalkan.");
        } finally {
          setIsAnalyzing(false);
        }
      }
    });
  };

  const handleOpenSettings = () => {
    setTempDisplayName(userDisplayName || userEmail?.split('@')[0] || 'User');
    setTempPassword(userPassword || 'password123');
    setShowSettingsModal(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDisplayName.trim()) {
      Swal.fire({
        icon: 'error',
        title: lang === 'id' ? 'Kesalahan' : 'Error',
        text: lang === 'id' ? 'Nama tampilan tidak boleh kosong.' : 'Display name cannot be empty.',
        confirmButtonColor: '#1e3a8a',
        background: darkMode ? '#18181b' : '#ffffff',
        color: darkMode ? '#f4f4f5' : '#18181b',
      });
      return;
    }

    localStorage.setItem('edumentor_user_display_name', tempDisplayName);
    localStorage.setItem('edumentor_user_password', tempPassword);

    setUserDisplayName(tempDisplayName);
    setUserPassword(tempPassword);
    setShowSettingsModal(false);

    Swal.fire({
      icon: 'success',
      title: lang === 'id' ? 'Profil Diperbarui' : 'Profile Updated',
      text: lang === 'id' ? 'Nama tampilan dan sandi Anda berhasil diperbarui.' : 'Your display name and password have been successfully updated.',
      confirmButtonColor: '#1e3a8a',
      background: darkMode ? '#18181b' : '#ffffff',
      color: darkMode ? '#f4f4f5' : '#18181b',
    });
  };

  // Start a new blank chat session on server
  const handleCreateNewChat = async () => {
    // If layout is already in a blank, unused document chat session, just reset state instead of duplicating
    if (activeDoc && activeDoc.size === 0 && messages.length === 0) {
      setQueryInput('');
      setAnalyzerError(null);
      return;
    }
    try {
      const newChat = await safeFetch('/api/documents/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Obrolan Baru' })
      });
      if (newChat) {
        setDocuments(prev => [newChat, ...prev]);
        setActiveDocumentId(newChat.id);
        setMessages([]);
      }
    } catch (err: any) {
      console.error(err);
      setAnalyzerError(err.message || "Gagal memulai obrolan baru.");
    }
  };

  // Handles Client-side File Upload with upfront validation
  const handleFileUpload = async (file: File) => {
    const filename = file.name;
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    
    // 1. Client-side Mime Type filter validation
    const allowedExtensions = ['pdf', 'docx', 'xlsx', 'csv'];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setAnalyzerError("Gagal Mengunggah: Format berkas tidak didukung. Harap pilih berkas PDF, Word (DOCX), Excel (XLSX), atau CSV.");
      return;
    }

    // 2. Client-side size gating (Excel/CSV: 5MB, PDF/DOCX: 10MB)
    const isSheet = fileExtension === 'xlsx' || fileExtension === 'csv';
    const maxSize = isSheet ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setAnalyzerError(
        `Ukuran berkas melebihi batas. (Batas maksimal ${isSheet ? 'Excel/CSV: 5MB' : 'PDF/DOCX: 10MB'})`
      );
      return;
    }

    setUploading(true);
    setAnalyzerError(null);

    // If current active session is a blank chat with size 0, attach document to this session directly
    const isCurrentDocBlank = activeDoc && activeDoc.size === 0;
    const uploadUrl = isCurrentDocBlank 
      ? `/api/upload?documentId=${activeDocumentId}` 
      : `/api/upload`;

    const tempId = isCurrentDocBlank ? activeDocumentId! : "temp_" + Date.now();

    if (isCurrentDocBlank) {
      // Set the active blank document to processing state
      setDocuments(prev => prev.map(d => 
        d.id === activeDocumentId 
          ? { ...d, name: file.name, size: file.size, status: 'processing' } 
          : d
      ));
    } else {
      const tempDoc: DocumentItem = {
        id: tempId,
        name: file.name,
        type: file.type || `application/${fileExtension}`,
        size: file.size,
        status: 'processing',
        createdAt: new Date().toISOString()
      };
      setDocuments(prev => [tempDoc, ...prev]);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await safeFetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (result) {
        // Update the temporary or current entry with the real saved metadata
        setDocuments(prev => prev.map(d => 
          d.id === tempId 
            ? { ...d, id: result.documentId, status: 'processed' } 
            : d
        ));
        
        // Auto-select the newly uploaded file
        setActiveDocumentId(result.documentId);
      }

    } catch (err: any) {
      console.error(err);
      setAnalyzerError(`Error unggah: ${err.message || err}`);
      // Mark temporary doc as error
      setDocuments(prev => prev.map(d => 
        d.id === tempId ? { ...d, status: 'error' } : d
      ));
    } finally {
      setUploading(false);
    }
  };

  // Deletes document metadata and local logs
  const handleDeleteDocument = async (id: string) => {
    try {
      await safeFetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      setDocuments(prev => prev.filter(d => d.id !== id));
      localStorage.removeItem(`chat_history_${id}`);
      if (activeDocumentId === id) {
        setActiveDocumentId(null);
      }
    } catch (err: any) {
      console.error(err);
      setAnalyzerError(err.message || "Koneksi gagal saat menghapus dokumen.");
    }
  };

  // Translates existing chat logs to the newly selected language using Gemini
  const handleToggleLang = async () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);

    if (messages.length > 0) {
      Swal.fire({
        title: nextLang === 'id' ? 'Menerjemahkan Percakapan...' : 'Translating Conversation...',
        text: nextLang === 'id'
          ? 'Mohon tunggu sementara EduMentor menerjemahkan riwayat chat Anda.'
          : 'Please wait while EduMentor translates your chat history.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        background: darkMode ? '#18181b' : '#ffffff',
        color: darkMode ? '#f4f4f5' : '#18181b',
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const payload = await safeFetch('/api/chat/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            targetLang: nextLang
          })
        });

        if (payload && Array.isArray(payload)) {
          setMessages(payload);
          if (activeDocumentId) {
            localStorage.setItem(`chat_history_${activeDocumentId}`, JSON.stringify(payload));
          }
          Swal.close();
        } else {
          throw new Error("Format respon tidak valid");
        }
      } catch (err: any) {
        console.error("Translation error:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: nextLang === 'id' ? 'Gagal menerjemahkan obrolan' : 'Failed to translate chat history',
          showConfirmButton: false,
          timer: 3000,
          background: darkMode ? '#27272a' : '#ffffff',
          color: darkMode ? '#f4f4f5' : '#18181b',
        });
      }
    }
  };

  // Queries the AI chat endpoint and feeds responses via progressive streams and state chunks
  const handleQuerySubmit = async () => {
    if (!queryInput.trim() || !activeDocumentId || isAnalyzing) return;

    const messageText = queryInput;
    setQueryInput('');
    setAnalyzerError(null);
    setIsAnalyzing(true);

    // Formulate a beautiful user message block
    const userMessage: ChatMessage = {
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      role: 'user',
      parts: [{ text: messageText }],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Prepare a blank container model chunk message for stream append
    const aiMessageId = "ai_" + Math.random().toString(36).substring(2, 11);
    const aiMessagePlaceholder: ChatMessage = {
      id: aiMessageId,
      role: 'model',
      parts: [{ text: '' }],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);

    // Construct simple history array compatible with Gemini parameter format
    // Map existing state list without the placeholder itself
    const historyPayload = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.parts[0].text }]
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: activeDocumentId,
          message: messageText,
          history: historyPayload,
          analysisStyle: analysisStyle,
          lang: lang
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errPayload = await response.json();
            throw new Error(errPayload.error || "Gagal memproses analisis.");
          } catch {
            throw new Error(`Gagal memproses analisis (Status ${response.status}).`);
          }
        } else {
          const textFallback = await response.text();
          if (textFallback.startsWith('<!doctype') || textFallback.startsWith('<!DOCTYPE') || textFallback.includes('<html')) {
            throw new Error(`Analisis gagal (Status ${response.status}). Server sedang memuat ulang, silakan coba kirim ulang pesan dalam beberapa detik.`);
          }
          throw new Error(textFallback.substring(0, 150) || "Gagal memproses analisis.");
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Penerimaan aliran data tidak didukung oleh peramban browser ini.");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });

        // Update the placeholder AI text content progressively
        setMessages(prev => {
          return prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, parts: [{ text: msg.parts[0].text + textChunk }] } 
              : msg
          );
        });
      }

    } catch (err: any) {
      console.error(err);
      const friendlyErrMsg = err.message || "Gagal memproses analisis.";
      setAnalyzerError(friendlyErrMsg);
      // Insert error diagnostics in AI container
      setMessages(prev => {
        return prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, parts: [{ text: `⚠️ **Pemberitahuan Sistem:** ${friendlyErrMsg}` }] } 
            : msg
        );
      });
    } finally {
      setIsAnalyzing(false);
      // Auto scroll chat box down
      setTimeout(() => {
        const scroller = document.getElementById('chat-scroller');
        if (scroller) {
          scroller.scrollTop = scroller.scrollHeight;
        }
      }, 100);
    }
  };

  if (!userEmail) {
    return <LoginView onLoginSuccess={handleLoginSuccess} lang={lang} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex font-sans text-slate-800 dark:text-slate-101 antialiased overflow-x-hidden">
      
      {/* Navigation sidebar Left panel */}
      <Sidebar
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={setActiveDocumentId}
        onDeleteDocument={handleDeleteDocument}
        analysisStyle={analysisStyle}
        onAnalysisStyleChange={setAnalysisStyle}
        onFileUpload={handleFileUpload}
        uploading={uploading}
        isOpenMobile={sidebarOpenMobile}
        setIsOpenMobile={setSidebarOpenMobile}
        activeUser={userEmail}
        userDisplayName={userDisplayName}
        onOpenSettings={handleOpenSettings}
        onNewChat={handleCreateNewChat}
        lang={lang}
        messagesCount={messages.length}
      />

      {/* Main Analysis workspace right side */}
      <main className="flex-1 min-h-screen flex flex-col lg:pl-64 transition-all duration-150 relative">
        
        {/* Upper Toolbar Bar */}
        <header id="workspace-header" className="h-14 bg-white/75 dark:bg-black/75 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 px-4 flex items-center justify-between shadow-sm fixed lg:left-64 top-0 left-0 right-0 z-30">
          <div className="flex items-center gap-2">
            
            {/* Mobile Sidebar Trigger hamburger button */}
            <button
              id="btn-sidebar-mobile-toggle"
              onClick={() => setSidebarOpenMobile(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-slate-400 lg:hidden focus:outline-none cursor-pointer"
              title="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Active document title path */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
              <span>EduMentor Workspace</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-750" />
              <span id="header-active-doc" className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {activeDoc 
                  ? (activeDoc.size > 0 ? activeDoc.name : (lang === 'id' ? 'Obrolan Umum' : 'General Chat')) 
                  : (lang === 'id' ? 'Masukkan Dokumen' : 'Ingest Document')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              id="btn-toggle-dark"
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded border border-slate-200/60 dark:border-zinc-800 shadow-sm cursor-pointer"
              title={darkMode ? (lang === 'id' ? "Aktifkan Mode Terang" : "Enable Light Mode") : (lang === 'id' ? "Aktifkan Mode Gelap" : "Enable Dark Mode")}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {/* Language Selection Button (ID/ENG Toggle) instead of sync button */}
            <button
              id="btn-toggle-lang"
              onClick={handleToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-650 dark:text-slate-300 text-xs font-semibold shadow-sm cursor-pointer transition-colors"
              title={lang === 'id' ? "Switch to English" : "Ubah ke Bahasa Indonesia"}
            >
              <Globe className="h-3.5 w-3.5 text-blue-605 dark:text-blue-450 shrink-0" />
              <span className="font-mono">{lang === 'id' ? 'ID' : 'ENG'}</span>
            </button>

            {/* Logout CTA */}
            <button
              id="workspace-logout"
              onClick={handleLogoutClick}
              className="flex items-center gap-1 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 rounded-lg py-1.5 px-2.5 text-[11px] font-semibold shadow-sm cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{lang === 'id' ? 'Keluar' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable conversation thread */}
        <ChatArea
          messages={messages}
          loadingHistory={loadingHistory}
          activeDocName={activeDoc ? activeDoc.name : null}
          emptyStateTitle="EduMentor Intelligence • Selamat Datang"
          emptyStateText="Untuk memulai analisis, silakan unggah berkas teks (PDF, Word) atau basis data (Excel, CSV) melalui tombol di bawah atau panel kiri. Ajukan rumus, mintalah visualisasi grafik secara cerdas, dan rangkum poin-poin pelajaran dengan cepat."
          lang={lang}
          isAnalyzing={isAnalyzing}
          onSuggestionClick={(prompt) => {
            setQueryInput(prompt);
            setTimeout(() => {
              const txt = document.getElementById('query-textarea');
              if (txt) {
                txt.focus();
              }
            }, 50);
          }}
        />

        {/* Action input bar pinned bottom */}
        <InputBar
          value={queryInput}
          onChange={setQueryInput}
          onSubmit={handleQuerySubmit}
          activeDocName={activeDoc ? activeDoc.name : null}
          activeDocStatus={activeDoc ? activeDoc.status : null}
          hasFile={!!(activeDoc && activeDoc.size > 0)}
          onFileUpload={handleFileUpload}
          onCancelFile={handleCancelFile}
          uploading={uploading}
          isAnalyzing={isAnalyzing}
          analyzerError={analyzerError}
          lang={lang}
        />

      </main>

      {/* Account Profile Setup & Configuration Dialog settings-modal */}
      {showSettingsModal && (
        <div id="settings-modal-backdrop" className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div id="settings-modal-card" className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl w-full max-w-md shadow-2xl p-6 relative transform scale-100 transition-all duration-300">
            <button
              id="btn-close-settings-top"
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-405 hover:text-slate-605 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-zinc-900 text-blue-900 dark:text-blue-400">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-101 font-sans">
                  {lang === 'id' ? 'Pengaturan Akun' : 'Account Settings'}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  {userEmail}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{lang === 'id' ? 'Nama Tampilan / Username' : 'Display Name / Username'}</span>
                </label>
                <input
                  id="settings-username-input"
                  type="text"
                  required
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  placeholder={lang === 'id' ? 'Masukkan nama lengkap atau panggilan' : 'Enter standard display name'}
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-900/50 text-slate-800 dark:text-slate-101 font-sans font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  <span>{lang === 'id' ? 'Sandi Baru' : 'New Password'}</span>
                </label>
                <input
                  id="settings-password-input"
                  type="password"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-900/50 text-slate-800 dark:text-slate-101 font-sans font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-cancel-settings"
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-650 dark:text-zinc-300 bg-white dark:bg-black hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  {lang === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  id="btn-save-settings"
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-blue-900 hover:bg-blue-850 dark:bg-blue-800 dark:hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {lang === 'id' ? 'Simpan' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
