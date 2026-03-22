import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  Languages, 
  TrendingUp, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Video as VideoIcon,
  Loader2,
  X,
  Zap,
  Clock,
  Users,
  Download,
  Layout,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  Facebook,
  MessageSquare,
  Globe,
  AlertCircle,
  RefreshCw,
  Music2
} from 'lucide-react';
import { analyzeMedia, ViralContent } from './services/geminiService';
import { LanguageSelector } from './components/LanguageSelector';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { code: 'English', name: 'English (US/UK)', region: 'Global' },
  { code: 'Spanish', name: 'Español (Spanish)', region: 'Global' },
  { code: 'French', name: 'Français (French)', region: 'Global' },
  { code: 'German', name: 'Deutsch (German)', region: 'Global' },
  { code: 'Portuguese', name: 'Português (Portuguese)', region: 'Global' },
  { code: 'Russian', name: 'Русский (Russian)', region: 'Global' },
  { code: 'Chinese (Simplified)', name: '简体中文 (Chinese)', region: 'Global' },
  { code: 'Japanese', name: '日本語 (Japanese)', region: 'Global' },
  { code: 'Korean', name: '한국어 (Korean)', region: 'Global' },
  { code: 'Arabic', name: 'العربية (Arabic)', region: 'Global' },
  { code: 'Hindi', name: 'हिन्दी (Hindi)', region: 'South Asia' },
  { code: 'Bengali', name: 'বাংলা (Bengali)', region: 'South Asia' },
  { code: 'Punjabi', name: 'ਪੰਜਾਬੀ (Punjabi)', region: 'South Asia' },
  { code: 'Marathi', name: 'मराठी (Marathi)', region: 'South Asia' },
  { code: 'Telugu', name: 'తెలుగు (Telugu)', region: 'South Asia' },
  { code: 'Tamil', name: 'தமிழ் (Tamil)', region: 'South Asia' },
  { code: 'Urdu', name: 'اردو (Urdu)', region: 'South Asia' },
  { code: 'Gujarati', name: 'ગુજરાતી (Gujarati)', region: 'South Asia' },
  { code: 'Kannada', name: 'ಕನ್ನಡ (Kannada)', region: 'South Asia' },
  { code: 'Malayalam', name: 'മലയാളം (Malayalam)', region: 'South Asia' },
  { code: 'Italian', name: 'Italiano (Italian)', region: 'Europe' },
  { code: 'Dutch', name: 'Nederlands (Dutch)', region: 'Europe' },
  { code: 'Turkish', name: 'Türkçe (Turkish)', region: 'Middle East' },
  { code: 'Vietnamese', name: 'Tiếng Việt (Vietnamese)', region: 'Southeast Asia' },
  { code: 'Thai', name: 'ไทย (Thai)', region: 'Southeast Asia' },
];

const PLATFORMS = [
  { id: 'Instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'TikTok', name: 'TikTok', icon: VideoIcon, color: 'text-zinc-100' },
  { id: 'YouTube', name: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'Facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'Twitter', name: 'Twitter (X)', icon: Twitter, color: 'text-zinc-100' },
  { id: 'LinkedIn', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'Pinterest', name: 'Pinterest', icon: ImageIcon, color: 'text-red-600' },
  { id: 'WhatsApp', name: 'WhatsApp Status', icon: MessageSquare, color: 'text-green-500' },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const [platform, setPlatform] = useState('Instagram');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ViralContent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isTurbo, setIsTurbo] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (loading) {
      // Faster animation for better perceived speed
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 600);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Revoke old preview URL if it exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    
    // Estimate time based on file size (assuming ~2MB/s upload speed + processing)
    const estimatedSeconds = Math.max(5, Math.ceil(file.size / (2 * 1024 * 1024)) + 5);
    setEstimatedTime(estimatedSeconds);

    let startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, estimatedSeconds - elapsed);
      setEstimatedTime(Math.ceil(remaining));
      
      // If we are in the API call part (progress >= 50), slowly increment towards 98%
      setProgress(prev => {
        if (prev >= 50 && prev < 98) {
          const increment = (98 - prev) * 0.05;
          return prev + increment;
        }
        return prev;
      });
    }, 1000);

    try {
      const data = await analyzeMedia(file, language, platform, isTurbo, (p) => {
        setProgress(p);
      });
      setProgress(100);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      clearInterval(timer);
      setLoading(false);
      setEstimatedTime(null);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setShowToast(true);
    setTimeout(() => setCopied(null), 2000);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = () => {
    if (!result) return;
    const report = `MEDIA ANALYSIS REPORT - ${platform.toUpperCase()}\n\n` +
      `TITLE: ${result.title}\n` +
      `CAPTION: ${result.description}\n\n` +
      `HASHTAGS: ${result.hashtags.join(' ')}\n\n` +
      `ENHANCEMENTS:\n${result.enhancements?.map((e, i) => `${i+1}. ${e}`).join('\n')}\n\n` +
      `STRATEGIC TIPS:\n${result.tips.map((t, i) => `${i+1}. ${t}`).join('\n')}`;
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analysis_Report_${platform}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Subtle Background Grain/Texture could go here, but keeping it clean for now */}

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-sm overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-pulse" />
        
        {/* Trending Ticker */}
        <div className="bg-indigo-600/10 border-b border-white/5 py-1.5 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[
              "🔥 TRENDING: #AIGenerated is peaking on TikTok",
              "📈 INSIGHT: 7-second loops are dominating Reels",
              "⚡ UPDATE: New YouTube Shorts algorithm update detected",
              "🎯 TIP: Use 'POV' hooks for 40% higher retention",
              "🔥 TRENDING: Minimalist aesthetic rising on Pinterest",
              "📈 INSIGHT: Carousel posts getting 2x reach on Instagram",
            ].map((text, i) => (
              <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/80 mx-8 flex items-center gap-2">
                <Zap className="w-2.5 h-2.5" />
                {text}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              "🔥 TRENDING: #AIGenerated is peaking on TikTok",
              "📈 INSIGHT: 7-second loops are dominating Reels",
              "⚡ UPDATE: New YouTube Shorts algorithm update detected",
              "🎯 TIP: Use 'POV' hooks for 40% higher retention",
              "🔥 TRENDING: Minimalist aesthetic rising on Pinterest",
              "📈 INSIGHT: Carousel posts getting 2x reach on Instagram",
            ].map((text, i) => (
              <span key={i + 10} className="text-[9px] font-bold uppercase tracking-widest text-indigo-400/80 mx-8 flex items-center gap-2">
                <Zap className="w-2.5 h-2.5" />
                {text}
              </span>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center transition-colors">
              <Sparkles className="w-5 h-5 text-indigo-400 fill-current" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">🚀 VIRAL ENGINE 🔥</h1>
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-zinc-500 mt-1.5">✨ CRACK THE ALGORITHM & GO VIRAL 📈</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector 
              languages={LANGUAGES}
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">⚙️ CONFIGURATION</h2>
                <button 
                  onClick={() => setIsTurbo(!isTurbo)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group",
                    isTurbo 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400" 
                      : "bg-white/5 border-white/10 text-zinc-500 hover:border-white/20"
                  )}
                >
                  <Zap className={cn("w-3 h-3 transition-transform group-hover:scale-110", isTurbo && "fill-current")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Turbo Mode</span>
                  <div className={cn(
                    "w-6 h-3 rounded-full relative transition-colors",
                    isTurbo ? "bg-amber-500/40" : "bg-zinc-800"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all",
                      isTurbo ? "left-3.5" : "left-0.5"
                    )} />
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2 group relative overflow-hidden h-[64px]",
                      platform === p.id 
                        ? "bg-indigo-600/10 border-indigo-500/50 text-white" 
                        : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20"
                    )}
                  >
                    <p.icon className={cn("w-4 h-4", platform === p.id ? p.color : "text-zinc-500")} />
                    <span className="text-[8px] font-bold uppercase tracking-tight truncate w-full text-center">{p.id}</span>
                  </button>
                ))}
              </div>

              <div 
                onClick={() => !preview && fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-square rounded-3xl border border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer overflow-hidden group",
                  preview ? "border-indigo-500/30 bg-zinc-900" : "border-white/10 bg-zinc-900/30 hover:border-white/20"
                )}
              >
                {preview ? (
                  <>
                    {file?.type.startsWith('video') ? (
                      <video src={preview} className="w-full h-full object-cover opacity-80" controls />
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest">Change Media</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-5 h-5 text-zinc-500" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 text-zinc-300">Upload Media</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Image or Video</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
              </div>

              <div className="flex flex-col gap-4">
                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => { setFile(null); setPreview(null); setResult(null); }} 
                    className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-colors flex items-center justify-center"
                    title="Reset All"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    className={cn(
                      "flex-1 h-14 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                      !file || loading 
                        ? "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5" 
                        : "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">
                          {file?.type.startsWith('video') ? (
                            loadingStep === 0 ? "Analyzing Video Frames..." :
                            loadingStep === 1 ? "Decoding Viral Patterns..." :
                            loadingStep === 2 ? "Scanning Trending Audio..." :
                            "Generating Strategy..."
                          ) : (
                            loadingStep === 0 ? "Scanning Visuals..." :
                            loadingStep === 1 ? "Analyzing Trends..." :
                            loadingStep === 2 ? "Optimizing SEO..." :
                            "Finalizing Report..."
                          )}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        🔥 GO VIRAL NOW! 🚀
                      </>
                    )}
                  </button>
                </div>

                {loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-white/5"
                  >
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                      <span className="text-zinc-500">
                        {progress < 50 ? '⚡ PROCESSING MEDIA' : '🚀 UPLOADING TO AI'}
                      </span>
                      <span className="text-indigo-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden p-[1px]">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                      />
                    </div>
                    {estimatedTime !== null && estimatedTime > 0 && (
                      <div className="flex items-center justify-end gap-2 text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        <span>Est. {formatTime(estimatedTime)} remaining</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {result ? (
            <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-white uppercase">📊 VIRAL STRATEGY REPORT</h2>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">✨ AI-POWERED GROWTH HACKING ✨</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 h-11 rounded-lg bg-zinc-800 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button 
                        onClick={() => {
                          const fullText = `TITLE: ${result.title}\n\nHOOK: ${result.platformData?.hook}\n\nCAPTION: ${result.description}\n\nHASHTAGS: ${result.hashtags.join(' ')}\n\nSEO TAGS: ${result.platformData?.tagsString}`;
                          copyToClipboard(fullText, 'all');
                        }}
                        className={cn(
                          "flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 h-11 rounded-lg transition-all font-bold uppercase tracking-widest text-[10px]",
                          copied === 'all' 
                            ? "bg-emerald-500 text-white" 
                            : "bg-indigo-600 text-white hover:bg-indigo-500"
                        )}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={copied === 'all' ? 'check' : 'copy'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {copied === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </motion.div>
                        </AnimatePresence>
                        {copied === 'all' ? 'Copied' : 'Copy Strategy'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-8 rounded-3xl bg-zinc-900 border border-white/5 relative overflow-hidden group">
                      <div className="relative z-10">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-4">📈 VIRAL POTENTIAL</label>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                              <circle 
                                cx="32" cy="32" r="28" fill="none" stroke="#6366f1" strokeWidth="6" 
                                strokeDasharray={176}
                                strokeDashoffset={176 - (176 * result.viralScore) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <span className="absolute text-lg font-bold">{result.viralScore}</span>
                          </div>
                          <div>
                            <p className="text-xl font-bold tracking-tight">VIRAL</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Score Index</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="h-full p-8 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col justify-between group relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">⏰ BEST TIME TO POST</label>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1.5">Algorithm-Based Timing</p>
                          </div>
                          <div className="w-12 h-12 bg-indigo-500/5 rounded-xl flex items-center justify-center border border-indigo-500/10 transition-colors">
                            <Clock className="w-6 h-6 text-indigo-400" />
                          </div>
                        </div>
                        <div className="mt-8 relative z-10">
                          <p className="text-4xl font-bold tracking-tight text-white">
                            {result.platformData?.bestTime || 'PEAK HOURS'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5 mt-8 relative z-10">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Local Timezone Optimized</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trend Analysis */}
                  {result.platformData?.trendAnalysis && (
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity">
                        <BarChart3 className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">📊 TREND RADAR</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Market Context</p>
                          </div>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-sm font-medium max-w-2xl">
                          {result.platformData.trendAnalysis}
                        </p>
                        {result.platformData.contentPillars && (
                          <div className="flex flex-wrap gap-2 mt-8">
                            {result.platformData.contentPillars.map((pillar, i) => (
                              <span key={i} className="px-4 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] transition-colors cursor-default">
                                {pillar}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Viral Title & Hook */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {result.title && (
                      <div className={cn(
                        "p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-500",
                        copied === 'title' 
                          ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/20" 
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06]"
                      )}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors">🔥 KILLER TITLE</label>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Scroll-Stopping Headline</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(result.title, 'title')}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={copied === 'title' ? 'check' : 'copy'}
                                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                                transition={{ duration: 0.2 }}
                              >
                                {copied === 'title' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                              </motion.div>
                            </AnimatePresence>
                          </button>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-white leading-tight">
                          {result.title}
                        </h3>
                      </div>
                    )}

                    {result.platformData?.hook && (
                      <div className={cn(
                        "p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group transition-all duration-500",
                        copied === 'hook' && "ring-4 ring-white/20 scale-[1.02]"
                      )}>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Zap className="w-32 h-32 fill-current" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">🪝 THE VIRAL HOOK</label>
                            <button 
                              onClick={() => copyToClipboard(result.platformData.hook || '', 'hook')}
                              className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
                            >
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={copied === 'hook' ? 'check' : 'copy'}
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {copied === 'hook' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </motion.div>
                              </AnimatePresence>
                            </button>
                          </div>
                          <h3 className="text-2xl font-bold leading-tight italic">
                            "{result.platformData.hook}"
                          </h3>
                          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                            <span className="w-1 h-1 rounded-full bg-white/40" />
                            Use in first 3 seconds
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Specific Insights */}
                  {file?.type.startsWith('video') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {result.platformData?.visualFlow && (
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">🎬 VISUAL FLOW</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{result.platformData.visualFlow}</p>
                        </div>
                      )}
                      {result.platformData?.hookTiming && (
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">⏱️ HOOK TIMING</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{result.platformData.hookTiming}</p>
                        </div>
                      )}
                      {result.platformData?.audioSuggestions && result.platformData.audioSuggestions.length > 0 && (
                        <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">🎵 AUDIO VIBE</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.platformData.audioSuggestions.map((audio, i) => (
                              <span key={i} className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                                {audio}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {file?.type.startsWith('video') && result.platformData?.retentionTips && result.platformData.retentionTips.length > 0 && (
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">📈 RETENTION STRATEGY</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.platformData.retentionTips.map((tip, i) => (
                          <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                              {i + 1}
                            </div>
                            <p className="text-xs text-zinc-400">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className={cn(
                        "p-6 rounded-[2rem] border group transition-all duration-500",
                        copied === 'desc' 
                          ? "bg-indigo-500/10 border-indigo-500/50" 
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                      )}>
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-indigo-400 transition-colors">📝 MAGIC CAPTION</label>
                          <button 
                            onClick={() => copyToClipboard(result.description, 'desc')} 
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={copied === 'desc' ? 'check' : 'copy'}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {copied === 'desc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                              </motion.div>
                            </AnimatePresence>
                          </button>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-zinc-200 whitespace-pre-wrap selection:bg-indigo-500/30">
                          {result.description}
                        </p>
                      </div>

                      <div className={cn(
                        "p-6 rounded-[2rem] border group transition-all duration-500",
                        copied === 'tags' 
                          ? "bg-indigo-500/10 border-indigo-500/50" 
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                      )}>
                        <div className="flex justify-between items-center mb-6">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-indigo-400 transition-colors">🏷️ HASHTAG MAGIC</label>
                          <button 
                            onClick={() => copyToClipboard(result.hashtags.join(' '), 'tags')} 
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={copied === 'tags' ? 'check' : 'copy'}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {copied === 'tags' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                              </motion.div>
                            </AnimatePresence>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.hashtags.map((tag, i) => (
                            <span key={i} className="px-3 py-1 rounded-lg bg-white/5 text-[11px] font-bold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all cursor-pointer border border-white/5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {result.platformData?.tagsString && (
                        <div className={cn(
                          "p-6 rounded-[2rem] border group transition-all duration-500",
                          copied === 'seo-tags' 
                            ? "bg-indigo-500/10 border-indigo-500/50" 
                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]"
                        )}>
                          <div className="flex justify-between items-center mb-6">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-indigo-400 transition-colors">🔍 SEO POWER</label>
                            <button 
                              onClick={() => copyToClipboard(result.platformData.tagsString || '', 'seo-tags')} 
                              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                            >
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={copied === 'seo-tags' ? 'check' : 'copy'}
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {copied === 'seo-tags' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                                </motion.div>
                              </AnimatePresence>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {result.platformData.tagsString.split(',').map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-zinc-500 border border-white/5">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Lightbulb className="w-5 h-5 text-amber-400" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">💡 PRO TIPS</h3>
                        </div>
                        <div className="space-y-4">
                          {result.tips.map((tip, i) => (
                            <div key={i} className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/[0.02] transition-all">
                              <span className="text-xs font-bold text-zinc-600 mt-0.5">{i+1}</span>
                              <p className="text-xs font-medium text-zinc-400 leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Layout className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-bold uppercase tracking-widest">✨ MAGIC TOUCH</h3>
                        </div>
                        <div className="space-y-4">
                          {result.enhancements?.map((enh, i) => (
                            <div key={i} className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/[0.02] transition-all">
                              <ArrowRight className="w-3 h-3 text-indigo-500 mt-1" />
                              <p className="text-xs font-medium text-zinc-400 leading-relaxed">{enh}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 rounded-[3rem] border-2 border-dashed border-white/5 bg-white/[0.01]">
                  <div className="w-32 h-32 bg-white/[0.02] rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <BarChart3 className="w-12 h-12 text-zinc-800" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4">🚀 READY FOR TAKEOFF?</h3>
                  <p className="text-zinc-500 text-sm max-w-sm font-medium leading-relaxed">
                    Upload your media and let our AI Growth Hacker explode your reach! 📈🔥
                  </p>
                  <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                      <Zap className="w-4 h-4 text-indigo-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Fast Insights</p>
                      <p className="text-[9px] text-zinc-600 mt-1">Real-time trend scanning</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                      <Globe className="w-4 h-4 text-emerald-400 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Multi-Platform</p>
                      <p className="text-[9px] text-zinc-600 mt-1">Optimized for every network</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

      <footer className="container mx-auto px-6 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-30">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">VIRAL VISION PRO</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <a href="#" className="hover:text-white transition-all">Privacy</a>
            <a href="#" className="hover:text-white transition-all">Terms</a>
            <a href="#" className="hover:text-white transition-all">Support</a>
          </div>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
            © 2026 • Engineered by <span className="text-indigo-400">Randhir</span>
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 border border-white/10 flex items-center gap-3">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest">Copied to clipboard</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
