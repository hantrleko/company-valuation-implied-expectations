import React, { useState, useEffect } from 'react';
import { Company, IndustryId } from '../types/financial';
import { COMPANIES } from '../data/companies';
import { STAGES, StageId } from './StageNavigator';
import { ALL_RESEARCH_MEMOS } from '../data/researchMemos';
import { Search, X, Command, ArrowRight, BookOpen, Layers, Target, Compass, BarChart2 } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCompany: (company: Company) => void;
  onSelectStage: (stage: StageId) => void;
  onOpenMemos: (companyId?: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectCompany,
  onSelectStage,
  onOpenMemos
}) => {
  const [query, setQuery] = useState('');

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Matched Companies
  const matchedCompanies = COMPANIES.filter(c => 
    c.ticker.toLowerCase().includes(trimmed) ||
    c.chineseName.toLowerCase().includes(trimmed) ||
    c.name.toLowerCase().includes(trimmed) ||
    c.id.toLowerCase().includes(trimmed)
  );

  // Matched Stages
  const matchedStages = STAGES.filter(s =>
    s.label.toLowerCase().includes(trimmed) ||
    s.enLabel.toLowerCase().includes(trimmed) ||
    s.desc.toLowerCase().includes(trimmed)
  );

  // Matched Memos
  const matchedMemos = ALL_RESEARCH_MEMOS.filter(m =>
    m.title.toLowerCase().includes(trimmed) ||
    m.subtitle.toLowerCase().includes(trimmed) ||
    m.companyId.toLowerCase().includes(trimmed)
  );

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/70">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="搜索公司代码 (如 TSLA/BYD)、分析阶段或研究备忘录 (按 ESC 退出)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 max-h-[60vh]">
          {/* Companies Section */}
          {matchedCompanies.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 block mb-1.5">
                公司与标的 ({matchedCompanies.length})
              </span>
              <div className="space-y-1">
                {matchedCompanies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectCompany(c);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-cyan-400 text-xs w-16">
                        {c.ticker}
                      </span>
                      <span className="text-xs text-slate-200 font-medium">
                        {c.chineseName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                        {c.industry}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 group-hover:text-cyan-300">
                      <span>{c.currencySymbol}{c.currentStockPrice}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stages Section */}
          {matchedStages.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 block mb-1.5">
                分析阶段与工作流 ({matchedStages.length})
              </span>
              <div className="space-y-1">
                {matchedStages.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStage(s.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-cyan-400 font-bold">
                        {s.num}
                      </span>
                      <div>
                        <span className="text-xs text-slate-200 font-medium block">
                          {s.label} ({s.enLabel})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Research Memos Section */}
          {matchedMemos.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-2 block mb-1.5">
                深度研报与预测账本 ({matchedMemos.length})
              </span>
              <div className="space-y-1">
                {matchedMemos.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onOpenMemos(m.companyId);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-slate-200 font-medium block truncate max-w-sm">
                          {m.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {m.companyId.toUpperCase()} · {m.recommendation} · {m.author}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>提示：输入股票代号如 TSLA 快速切换</span>
          <div className="flex items-center gap-2">
            <span>↑↓ 导航</span>
            <span>↵ 选择</span>
          </div>
        </div>
      </div>
    </div>
  );
};
