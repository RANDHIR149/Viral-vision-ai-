import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Language {
  code: string;
  name: string;
  region: string;
}

interface LanguageSelectorProps {
  languages: Language[];
  currentLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  currentLanguage,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = languages.find((l) => l.code === currentLanguage) || languages[0];

  const filteredLanguages = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLanguages = filteredLanguages.reduce((acc, lang) => {
    if (!acc[lang.region]) {
      acc[lang.region] = [];
    }
    acc[lang.region].push(lang);
    return acc;
  }, {} as Record<string, Language[]>);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-all group shadow-inner"
      >
        <Globe className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
          {selectedLanguage.name}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-zinc-600 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-72 max-h-[480px] bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[100] flex flex-col"
          >
            <div className="p-4 border-bottom border-white/5 bg-zinc-900/50 backdrop-blur-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {Object.entries(groupedLanguages).length > 0 ? (
                (Object.entries(groupedLanguages) as [string, Language[]][]).map(([region, langs]) => (
                  <div key={region} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">
                      {region}
                    </div>
                    <div className="space-y-1">
                      {langs.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onLanguageChange(lang.code);
                            setIsOpen(false);
                            setSearchQuery('');
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                            currentLanguage === lang.code
                              ? "bg-indigo-500/10 text-white"
                              : "hover:bg-white/5 text-zinc-400 hover:text-white"
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {lang.name}
                          </span>
                          {currentLanguage === lang.code && (
                            <Check className="w-3 h-3 text-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No languages found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
