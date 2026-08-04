import { create } from 'zustand'

export const TRANSLATIONS = {
  en: {
    // Sidebar
    newChat: 'New Chat',
    searchChats: 'Search chats...',
    noChatsYet: 'No chats yet',
    startNewConversation: 'Start a new conversation',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    today: 'Today',
    yesterday: 'Yesterday',
    previous7Days: 'Previous 7 Days',
    older: 'Older',
    pinned: 'Pinned',
    rename: 'Rename',
    pinToTop: 'Pin to top',
    unpin: 'Unpin',
    shareCopy: 'Share / Copy',
    delete: 'Delete',
    chatCopied: 'Chat copied to clipboard',
    confirmClearHistory: 'Are you sure you want to clear all chat history? This cannot be undone.',
    historyCleared: 'Chat history cleared',
    failedClearHistory: 'Failed to clear history',
    
    // Header & Dashboard
    chatPremium: 'lumiox',
    connectionFailed: 'Connection Failed',
    cannotReachServer: 'Cannot reach the server. Check your internet connection.',
    retry: 'Retry',
    explainConcept: 'Explain a concept',
    summarizeDocument: 'Summarize a document',
    brainstormIdeas: 'Brainstorm ideas',
    typeMessage: 'Type a message...',
    typeMessagePlaceholder: 'Type a message... (Shift+Enter for new line)',
    chatExported: 'Chat exported successfully',
    
    // Dashboard Stats & Charts
    dashboardTitle: 'Dashboard',
    dashboardDesc: 'Your AI usage overview and statistics',
    totalChatsLabel: 'Total Chats',
    messagesLabel: 'Messages',
    providersActiveLabel: 'Providers Active',
    avgMessagesChatLabel: 'Avg. Messages/Chat',
    weeklyActivityLabel: 'Weekly Activity',
    providerUsageLabel: 'Provider Usage',
    startChattingStats: 'Start chatting to see statistics',
    
    // Profile
    editProfile: 'Edit Profile',
    fullName: 'Full Name',
    username: 'Username',
    email: 'Email',
    memberSince: 'Member Since',
    saveChanges: 'Save Changes',
    signOut: 'Sign Out',
    profileUpdated: 'Profile updated successfully',
    manageAccountInfo: 'Manage your account information',
    cancel: 'Cancel',
    save: 'Save',
    plan: 'Plan',
    accountDetails: 'Account Details',
    memberSinceLabel: 'Member since',
    failedUpdateProfile: 'Failed to update profile',
    name: 'Name',
    
    // Settings General
    general: 'General',
    appearance: 'Appearance',
    aiProvider: 'AI Provider',
    models: 'Models',
    notifications: 'Notifications',
    shortcuts: 'Shortcuts',
    privacy: 'Privacy',
    about: 'About',
    manageGeneralPref: 'Manage your general preferences',
    streaming: 'Streaming',
    showRealtime: 'Show responses in real-time as they generate',
    language: 'Language',
    interfaceLang: 'Interface language (UI text)',
    customizeLooks: 'Customize how the application looks',
    theme: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    clearHistory: 'Clear Chat History',
    permanentlyDelete: 'This will permanently delete all your conversations',
    provider: 'AI Provider',
    
    // Settings Tabs Detail
    selectAndConfigureProviders: 'Select and configure your AI providers',
    apiKeyRequired: 'API Key Required',
    loadingModels: 'Loading models...',
    modelSettings: 'Model Settings',
    configureModelParams: 'Configure AI model parameters',
    defaultModel: 'Default Model',
    activeProvider: 'Active provider',
    refresh: 'Refresh',
    temperatureLabel: 'Temperature',
    temperatureDesc: 'Controls randomness. Lower = more focused, Higher = more creative.',
    precise: 'Precise',
    balanced: 'Balanced',
    creative: 'Creative',
    maxTokensLabel: 'Max Tokens',
    maxTokensDesc: 'Maximum length of the AI response.',
    topPDesc: 'Nucleus sampling. Lower = more conservative outputs.',
    systemPrompt: 'System Prompt',
    systemPromptDesc: 'Custom instructions for the AI to follow.',
    
    // Settings Notifications & Shortcuts
    manageNotifPref: 'Manage your notification preferences',
    toastNotif: 'Toast Notifications',
    toastNotifDesc: 'Show popup notifications for actions',
    soundEffects: 'Sound Effects',
    soundEffectsDesc: 'Play sounds for message events',
    desktopNotif: 'Desktop Notifications',
    desktopNotifDesc: 'Browser push notifications',
    shortcutsDesc: 'Speed up your workflow with shortcuts',
    sendMessage: 'Send message',
    newLine: 'New line',
    newChatAction: 'New chat',
    toggleSidebarAction: 'Toggle sidebar',
    searchChatsAction: 'Search chats',
    
    // Settings Privacy & About
    privacyData: 'Privacy & Data',
    privacyDataDesc: 'Manage your data and privacy',
    exportData: 'Export Data',
    exportDataDesc: 'Download all your chat history as JSON',
    export: 'Export',
    clearAllHistory: 'Clear All History',
    clearAllHistoryDesc: 'Permanently delete all chat sessions',
    clear: 'Clear',
    appInfo: 'Application information',
    appDesc: 'Multi-provider AI Chat application with premium UI. Supports multiple AI providers through a unified, elegant interface designed for productivity and delight.',
    
    // Status & Toast
    noKey: 'No Key',
    languageUpdated: 'Language updated',
    
    // EmptyState
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    howCanIHelp: 'How can I help you today?',
    askAnything: 'Ask me anything...',
    explainConceptDesc: 'Break down complex topics',
    writeSomeCode: 'Write some code',
    writeSomeCodeDesc: 'Generate code snippets',
    summarizeDocumentDesc: 'Condense long content',
    brainstormIdeasDesc: 'Creative thinking partner'
  },
  id: {
    // Sidebar
    newChat: 'Chat Baru',
    searchChats: 'Cari chat...',
    noChatsYet: 'Belum ada chat',
    startNewConversation: 'Mulai percakapan baru',
    darkMode: 'Mode Gelap',
    lightMode: 'Mode Terang',
    settings: 'Pengaturan',
    profile: 'Profil',
    logout: 'Keluar',
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    previous7Days: '7 Hari Terakhir',
    older: 'Lebih Lama',
    pinned: 'Disematkan',
    rename: 'Ubah Nama',
    pinToTop: 'Sematkan ke atas',
    unpin: 'Lepas Sematan',
    shareCopy: 'Bagikan / Salin',
    delete: 'Hapus',
    chatCopied: 'Percakapan disalin ke papan klip',
    confirmClearHistory: 'Apakah Anda yakin ingin menghapus semua riwayat chat? Tindakan ini tidak dapat dibatalkan.',
    historyCleared: 'Riwayat chat berhasil dihapus',
    failedClearHistory: 'Gagal menghapus riwayat',
    
    // Header & Dashboard
    chatPremium: 'AI Chat Premium',
    connectionFailed: 'Koneksi Gagal',
    cannotReachServer: 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.',
    retry: 'Coba Lagi',
    explainConcept: 'Jelaskan konsep',
    summarizeDocument: 'Ringkas dokumen',
    brainstormIdeas: 'Brainstorm ide',
    typeMessage: 'Ketik pesan...',
    typeMessagePlaceholder: 'Ketik pesan... (Shift+Enter untuk baris baru)',
    chatExported: 'Percakapan berhasil diekspor',
    
    // Dashboard Stats & Charts
    dashboardTitle: 'Dashboard',
    dashboardDesc: 'Ikhtisar dan statistik penggunaan AI Anda',
    totalChatsLabel: 'Total Chat',
    messagesLabel: 'Total Pesan',
    providersActiveLabel: 'Penyedia Aktif',
    avgMessagesChatLabel: 'Rata-rata Pesan/Chat',
    weeklyActivityLabel: 'Aktivitas Mingguan',
    providerUsageLabel: 'Penggunaan Penyedia',
    startChattingStats: 'Mulai berkirim pesan untuk melihat statistik',
    
    // Profile
    editProfile: 'Edit Profil',
    fullName: 'Nama Lengkap',
    username: 'Nama Pengguna',
    email: 'Email',
    memberSince: 'Anggota Sejak',
    saveChanges: 'Simpan Perubahan',
    signOut: 'Keluar',
    profileUpdated: 'Profil berhasil diperbarui',
    manageAccountInfo: 'Kelola informasi akun Anda',
    cancel: 'Batal',
    save: 'Simpan',
    plan: 'Paket',
    accountDetails: 'Detail Akun',
    memberSinceLabel: 'Anggota sejak',
    failedUpdateProfile: 'Gagal memperbarui profil',
    name: 'Nama',
    
    // Settings General
    general: 'Umum',
    appearance: 'Tampilan',
    aiProvider: 'Penyedia AI',
    models: 'Model',
    notifications: 'Notifikasi',
    shortcuts: 'Pintasan',
    privacy: 'Privasi',
    about: 'Tentang',
    manageGeneralPref: 'Kelola preferensi umum Anda',
    streaming: 'Streaming',
    showRealtime: 'Tampilkan respons secara real-time saat dibuat',
    language: 'Bahasa',
    interfaceLang: 'Bahasa antarmuka (Teks UI)',
    customizeLooks: 'Sesuaikan tampilan aplikasi',
    theme: 'Tema',
    system: 'Sistem',
    light: 'Terang',
    dark: 'Gelap',
    clearHistory: 'Hapus Riwayat Chat',
    permanentlyDelete: 'Tindakan ini akan menghapus semua percakapan Anda secara permanen',
    provider: 'Penyedia AI',
    
    // Settings Tabs Detail
    selectAndConfigureProviders: 'Pilih dan konfigurasi penyedia AI Anda',
    apiKeyRequired: 'Membutuhkan API Key',
    loadingModels: 'Memuat model...',
    modelSettings: 'Pengaturan Model',
    configureModelParams: 'Konfigurasi parameter model AI',
    defaultModel: 'Model Default',
    activeProvider: 'Penyedia aktif',
    refresh: 'Segarkan',
    temperatureLabel: 'Suhu (Temperature)',
    temperatureDesc: 'Mengatur keacakan. Lebih rendah = lebih fokus, Lebih tinggi = lebih kreatif.',
    precise: 'Tepat (Precise)',
    balanced: 'Seimbang (Balanced)',
    creative: 'Kreatif (Creative)',
    maxTokensLabel: 'Token Maksimal',
    maxTokensDesc: 'Panjang maksimum dari respon AI.',
    topPDesc: 'Nucleus sampling. Lebih rendah = output lebih konservatif.',
    systemPrompt: 'System Prompt',
    systemPromptDesc: 'Instruksi khusus yang harus diikuti oleh AI.',
    
    // Settings Notifications & Shortcuts
    manageNotifPref: 'Kelola preferensi notifikasi Anda',
    toastNotif: 'Notifikasi Toast',
    toastNotifDesc: 'Tampilkan notifikasi popup untuk tindakan',
    soundEffects: 'Efek Suara',
    soundEffectsDesc: 'Mainkan suara untuk peristiwa pesan',
    desktopNotif: 'Notifikasi Desktop',
    desktopNotifDesc: 'Notifikasi push browser',
    shortcutsDesc: 'Percepat alur kerja Anda dengan tombol pintasan',
    sendMessage: 'Kirim pesan',
    newLine: 'Baris baru',
    newChatAction: 'Chat baru',
    toggleSidebarAction: 'Buka/Tutup sidebar',
    searchChatsAction: 'Cari chat',
    
    // Settings Privacy & About
    privacyData: 'Privacy & Data',
    privacyDataDesc: 'Kelola data dan privasi Anda',
    exportData: 'Ekspor Data',
    exportDataDesc: 'Unduh seluruh riwayat chat Anda sebagai file JSON',
    export: 'Ekspor',
    clearAllHistory: 'Hapus Semua Riwayat',
    clearAllHistoryDesc: 'Hapus semua sesi chat secara permanen',
    clear: 'Hapus',
    appInfo: 'Informasi aplikasi',
    appDesc: 'Aplikasi Chat AI multi-penyedia dengan UI premium. Mendukung banyak penyedia AI melalui antarmuka yang seragam dan elegan yang dirancang untuk produktivitas dan kepuasan.',
    
    // Status & Toast
    noKey: 'Tanpa Key',
    languageUpdated: 'Bahasa berhasil diperbarui',
    
    // EmptyState
    goodMorning: 'Selamat pagi',
    goodAfternoon: 'Selamat siang',
    goodEvening: 'Selamat malam',
    howCanIHelp: 'Ada yang bisa saya bantu hari ini?',
    askAnything: 'Tanyakan apa saja...',
    explainConceptDesc: 'Urai topik yang rumit',
    writeSomeCode: 'Tulis kode pemrograman',
    writeSomeCodeDesc: 'Hasilkan cuplikan kode',
    summarizeDocumentDesc: 'Ringkas konten yang panjang',
    brainstormIdeasDesc: 'Mitra berpikir kreatif'
  }
} as const

export type TranslationKey = keyof typeof TRANSLATIONS.en

interface LanguageState {
  language: 'en' | 'id'
  setLanguage: (lang: 'en' | 'id') => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang) => {
    set({ language: lang })
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }
}))

export function useTranslation() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  const t = (key: TranslationKey): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || String(key)
  }

  return { language, setLanguage, t }
}
