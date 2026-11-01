import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, FileText, Calendar, Hash, Bookmark, CheckCircle, AlertCircle } from 'lucide-react';
import { DisclosureSource } from '../types/financial';

interface DisclosureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metricName: string;
  periodLabel: string;
  formattedValue: string;
  disclosure: DisclosureSource | null;
}

export const DisclosureDrawer: React.FC<DisclosureDrawerProps> = ({
  isOpen,
  onClose,
  metricName,
  periodLabel,
  formattedValue,
  disclosure
}) => {
  const [auditConfirmed, setAuditConfirmed] = useState(true);

  if (!isOpen || !disclosure) return null;

  const isSec = disclosure.filingType.includes('10-') || disclosure.filingType.includes('20-') || disclosure.filingType.includes('6-');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                原始披露真实性穿透审计
              </span>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                {metricName}
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {periodLabel}
                </span>
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighted Value Card */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-850 to-slate-900 border border-cyan-900/30">
          <span className="text-xs text-slate-400 font-medium">重构审计确认数值</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {formattedValue}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                auditConfirmed 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' 
                  : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${auditConfirmed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {auditConfirmed ? `已人工比对核准 (${isSec ? 'SEC EDGAR' : '巨潮资讯'})` : '待复核比对'}
              </span>
            </div>
            <button
              onClick={() => setAuditConfirmed(!auditConfirmed)}
              className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-mono"
            >
              {auditConfirmed ? '标记为待复核' : '确认无误已核准'}
            </button>
          </div>
        </div>

        {/* Audit Details */}
        <div className="mt-6 space-y-4">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-cyan-400" /> 报告类型
              </span>
              <span className="font-mono font-semibold text-slate-200 px-2 py-0.5 rounded bg-slate-800">
                {disclosure.filingType}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-cyan-400" /> 官方披露日期
              </span>
              <span className="font-mono text-slate-300">
                {disclosure.filingDate}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Hash className="w-4 h-4 text-cyan-400" /> {isSec ? 'SEC Accession No.' : '巨潮公告编号'}
              </span>
              <span className="font-mono text-xs text-cyan-400 select-all">
                {disclosure.accessionNumber}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-850 text-xs">
              <span className="text-slate-500 block text-[11px]">对应报表章节与分部:</span>
              <span className="text-slate-300 font-medium">{disclosure.section}</span>
            </div>

            <div className="text-xs">
              <span className="text-slate-500 block text-[11px]">原始披露科目名称:</span>
              <span className="text-slate-200 font-mono">{disclosure.lineItem}</span>
            </div>
          </div>

          {/* Original Filing Quote */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Bookmark className="w-4 h-4 text-amber-400" /> 原始披露原文片段 / 附注说明
            </label>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 font-serif leading-relaxed italic bg-opacity-80">
              "{disclosure.quote}"
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-slate-800 flex items-center gap-3">
          <a
            href={disclosure.secOrCninfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-lg shadow-cyan-900/30"
          >
            <ExternalLink className="w-4 h-4" />
            前往 {isSec ? 'SEC EDGAR 原始披露' : '巨潮官方报告'} 查验
          </a>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
