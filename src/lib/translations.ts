export type Language = 'id' | 'en';

export const translations = {
  id: {
    brandTitle: "EduMentor Intelligence",
    brandDesc: "Platform tanya-jawab AI interaktif untuk menganalisis dokumen pelajaran & data.",
    workspaceTitle: "EduMentor Workspace",
    
    // Auth / Login
    emailLabel: "Alamat Email",
    emailPlaceholder: "misal: dhani@domain.com",
    passwordLabel: "Kata Sandi",
    errorRequired: "Harap masukkan email dan kata sandi Anda.",
    loginEmailBtn: "Masuk dengan Email",
    loginGoogleBtn: "Masuk dengan Google (OAuth)",
    orSeparator: "atau",
    loadingText: "Memuat...",

    // Sidebar
    newChatBtn: "Obrolan Baru",
    analysisStyleLabel: "Arah Analisis (Style)",
    conversationalOption: "Conversational (Analogi & Ramah)",
    formalOption: "Formal (Struktur & Akademik)",
    todayGroup: "Hari Ini",
    earlierGroup: "Sebelumnya",
    noDocsToday: "Belum ada dokumen/percakapan hari ini",
    noDocsEarlier: "Tidak ada riwayat lama",
    deleteTooltip: "Hapus Riwayat",
    confirmDeleteTitle: "Hapus Dokumen & Riwayat?",
    confirmDeleteDesc: 'Apakah Anda yakin ingin menghapus "{name}"? Seluruh catatan analisis dan riwayat percakapan AI untuk dokumen ini akan dihapus permanen.',
    btnCancel: "Batalkan",
    btnConfirmDelete: "Ya, Hapus!",
    activeWorkspace: "Ruang Kerja Aktif",
    aiConvText: "Percakapan AI",

    // Chat Area / Empty State
    emptyStateTitle: "Mulai Percakapan AI Baru",
    emptyStateDesc: "Ajukan pertanyaan langsung pada EduMentor AI atau unggah berkas PDF/Docx/CSV untuk mengupas tuntas isinya.",
    readyDocDesc: "Dokumen siap dianalisis! Masukkan pertanyaan di bawah untuk mulai berinteraksi dengan AI.",
    cardSummarizeTitle: "Rangkum Dokumen",
    cardSummarizeDesc: "Dapatkan korelasi & poin-poin penting isi file dalam hitungan detik.",
    cardVisualTitle: "Temukan Visualisasi",
    cardVisualDesc: "Ekstrak tren data angka langsung menjadi grafik visual atas permintaan Anda.",
    thinkingRead: "Membaca seluruh konten dokumen...",
    thinkingBrain: "Mendefinisikan korelasi konsep kunci...",
    thinkingTrend: "Menyaring korelasi angka dan tren...",
    thinkingBook: "Mengintegrasikan penjelasan ilmiah & teori...",
    thinkingFinal: "Melakukan finalisasi format respons AI...",
    typingIndicator: "EduMentor sedang mengetik...",

    // Input Bar
    activeDocReady: "Siap",
    activeDocParsing: "Menganalisis berkas...",
    activeDocError: "Kesalahan",
    noDocHint: "Anda berada dalam mode obrolan umum. Unggah berkas untuk menganalisis dokumen.",
    analyzingDocs: "Menganalisis...",
    attachTitle: "Lampirkan dokumen baru (.pdf, .docx, .xlsx, .csv)",
    placeholderReady: "Tanyakan apa saja tentang dokumen ini...",
    placeholderProcessing: "Mohon tunggu, dokumen sedang dianalisis...",
    placeholderNoDoc: "Tanyakan apa saja tentang pelajaran atau topik pendidikan di sini...",
    btnSendTitle: "Kirim",
    errorMessageNotice: "Pemberitahuan: Terjadi kesalahan saat membaca dokumen.",

    // General Header
    syncTitle: "Sinkronisasi Berkas",
    logoutTitle: "Keluar",
    lightModeTitle: "Aktifkan Mode Terang",
    darkModeTitle: "Aktifkan Mode Gelap",
    serverReloadError: "Koneksi server gagal. Mohon tunggu sebentar selagi server memuat ulang.",
    serverJsonError: "Gagal mengurai respon data JSON dari server.",
    serverReloadTimeout: "Server sedang memuat ulang. Silakan klik tombol sinkronisasi atau coba lagi dalam beberapa detik.",
    serverNonJsonError: "Server mengirimkan respon non-JSON.",
    serverCreateChatErr: "Gagal memulai obrolan baru.",
    serverDeleteErr: "Gagal menghapus berkas."
  },
  en: {
    brandTitle: "EduMentor Intelligence",
    brandDesc: "An interactive AI Q&A platform to analyze lessons, documents, and data.",
    workspaceTitle: "EduMentor Workspace",

    // Auth / Login
    emailLabel: "Email Address",
    emailPlaceholder: "e.g., dhani@domain.com",
    passwordLabel: "Password",
    errorRequired: "Please enter your email and password.",
    loginEmailBtn: "Sign In with Email",
    loginGoogleBtn: "Sign In with Google (OAuth)",
    orSeparator: "or",
    loadingText: "Loading...",

    // Sidebar
    newChatBtn: "New Chat",
    analysisStyleLabel: "Analysis Style",
    conversationalOption: "Conversational (Analogies & Friendly)",
    formalOption: "Formal (Structured & Academic)",
    todayGroup: "Today",
    earlierGroup: "Earlier",
    noDocsToday: "No docs/chats today",
    noDocsEarlier: "No history",
    deleteTooltip: "Delete History",
    confirmDeleteTitle: "Delete Document & History?",
    confirmDeleteDesc: 'Are you sure you want to delete "{name}"? All analysis outputs and conversation history will be permanently deleted.',
    btnCancel: "Cancel",
    btnConfirmDelete: "Yes, Delete!",
    activeWorkspace: "Active Workspace",
    aiConvText: "AI Chat",

    // Chat Area / Empty State
    emptyStateTitle: "Start a New AI Chat",
    emptyStateDesc: "Ask EduMentor AI anything directly, or upload PDF/Docx/CSV files to explore and untangle their content.",
    readyDocDesc: "Document ready for analysis! Type your questions below to start interacting with the AI.",
    cardSummarizeTitle: "Summarize Document",
    cardSummarizeDesc: "Get key takeaways and correlations from your files in seconds.",
    cardVisualTitle: "Spot Visualizations",
    cardVisualDesc: "Extract numerical data trends directly into raw visual graphs upon request.",
    thinkingRead: "Reading document contents...",
    thinkingBrain: "Defining key concepts and correlations...",
    thinkingTrend: "Extracting trends and patterns...",
    thinkingBook: "Integrating scholarly explanations...",
    thinkingFinal: "Finalizing response output...",
    typingIndicator: "EduMentor is typing...",

    // Input Bar
    activeDocReady: "Ready",
    activeDocParsing: "Parsing file...",
    activeDocError: "Error",
    noDocHint: "You are chatting in general mentor mode. Upload a doc to analyze files.",
    analyzingDocs: "Analyzing...",
    attachTitle: "Attach new document (.pdf, .docx, .xlsx, .csv)",
    placeholderReady: "Ask anything about this document...",
    placeholderProcessing: "Please wait, file is being parsed...",
    placeholderNoDoc: "Ask general mentor questions, or type direct queries here",
    btnSendTitle: "Send",
    errorMessageNotice: "Notice: An error occurred while parsing the document.",

    // General Header
    syncTitle: "Sync Ingests",
    logoutTitle: "Sign Out",
    lightModeTitle: "Switch to Light Mode",
    darkModeTitle: "Switch to Dark Mode",
    serverReloadError: "Server connection failed. Please wait a moment while the server reloads.",
    serverJsonError: "Failed to parse JSON response from the server.",
    serverReloadTimeout: "Server is reloading. Please click sync or try again in a few seconds.",
    serverNonJsonError: "Server sent non-JSON response.",
    serverCreateChatErr: "Failed to create new chat session.",
    serverDeleteErr: "Failed to delete file."
  }
};
