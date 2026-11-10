import React from 'react';
import { Company, IndustryId } from '../types/financial';
import { COMPANIES } from '../data/companies';
import { formatCurrency } from '../utils/formatters';
import { BookOpen, Activity, Cpu, Car, Search, Command } from 'lucide-react';

interface NavbarProps {
  activeIndustry: IndustryId;
  onSelectIndustry: (ind: IndustryId) => void;
  activeCompany: Company;
  onSelectCompany: (company: Company) => void;
  onOpenMemos: () => void;
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeIndustry,
  onSelectIndustry,
  activeCompany,
  onSelectCompany,
  onOpenMemos,
  onOpenCommandPalette
}) => {
  const currentIndustryCompanies = COMPANIES.filter((c) => c.industryId === activeIndustry);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 text-slate-100 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Industry Toggle */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30 flex-shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                Eugene Finance ｜ 02 公司与产业
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono font-bold">
                v3.1 深度交互与美学版
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              公司经营、估值与市场隐含预期实验室
            </h1>
          </div>

          {/* Industry Pills */}
          <div className="flex items-center gap-1 ml-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                onSelectIndustry('ev-mobility');
                const firstEv = COMPANIES.find(c => c.industryId === 'ev-mobility');
                if (firstEv) onSelectCompany(firstEv);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeIndustry === 'ev-mobility'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>智能电动车 (5强)</span>
            </button>
            <button
              onClick={() => {
                onSelectIndustry('semiconductors');
                const firstSemi = COMPANIES.find(c => c.industryId === 'semiconductors');
                if (firstSemi) onSelectCompany(firstSemi);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeIndustry === 'semiconductors'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI半导体算力 (5强)</span>
            </button>
          </div>
        </div>

        {/* Company Quick Switcher with Indicator Lights */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
          {currentIndustryCompanies.map((comp) => {
            const isSelected = comp.id === activeCompany.id;
            // Simulated valuation indicator dot: TSLA/NIO overvalued (amber/rose), BYD/LI/TSM/ASML undervalued (green)
            const indicatorColor = comp.id === 'byd' || comp.id === 'tsm' || comp.id === 'asml' 
              ? 'bg-emerald-400' 
              : comp.id === 'tsla' || comp.id === 'nvda' 
                ? 'bg-amber-400' 
                : 'bg-cyan-400';

            return (
              <button
                key={comp.id}
                onClick={() => onSelectCompany(comp)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`}></span>
                <span className="font-mono">{comp.ticker.replace('.SZ', '')}</span>
                <span className="text-[11px] opacity-80">{comp.chineseName}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {comp.currencySymbol}{comp.currentStockPrice}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions: Command Palette & Research Memos */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-colors"
            title="快捷搜索 (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <kbd className="text-[10px] bg-slate-900 px-1 py-0.2 rounded border border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={onOpenMemos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-semibold transition-colors shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>10 份研报与对账本</span>
          </button>
        </div>
      </div>
    </header>
  );
};
