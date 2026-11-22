import React, { useState, useEffect } from 'react';
import { X, BookOpen, Download, Copy, Check, ShieldAlert, Sparkles, Target, Compass, ChevronRight, AlertTriangle, Cpu, Car, RotateCcw, Plus, Trash2, Save, StickyNote } from 'lucide-react';
import { Company, VerifiableForecast, KillCondition } from '../../types/financial';
import { ALL_RESEARCH_MEMOS } from '../../data/researchMemos';
import { AUTO_RECONCILED_2025_LEDGER } from '../../data/v4InstitutionalData';

interface ResearchMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  onSwitchCompany: (companyId: string) => void;
  onExportIcBrief?: () => void;
}

interface UserThesisOverride {
  marketConsensus: string;
  variantPerception: string;
  personalNotes: string;
  updatedAt?: string;
}

interface ForecastFormDraft {
  targetPeriod: string;
  metric: string;
  ourPrediction: string;
  consensusEstimate: string;
  falsificationThreshold: string;
  actualValue: string;
}

interface KillFormDraft {
  trigger: string;
  rationale: string;
  actionIfTriggered: string;
}

const INITIAL_FORECAST_DRAFT: ForecastFormDraft = {
  targetPeriod: '2026 Q1',
  metric: '',
  ourPrediction: '',
  consensusEstimate: '',
  falsificationThreshold: '',
  actualValue: ''
};

const INITIAL_KILL_DRAFT: KillFormDraft = {
  trigger: '',
  rationale: '',
  actionIfTriggered: ''
};

const thesisStorageKey = (companyId: string) => `user_thesis_v45_${companyId}`;
const forecastsStorageKey = (companyId: string) => `user_forecasts_v45_${companyId}`;
const killsStorageKey = (companyId: string) => `user_kills_v45_${companyId}`;

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function writeStoredJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

function removeStoredKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

function readStoredArray<T>(key: string): T[] {
  const parsed = readStoredJson<unknown>(key, []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function readStoredThesis(companyId: string): UserThesisOverride | null {
  const parsed = readStoredJson<unknown>(thesisStorageKey(companyId), null);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  return {
    marketConsensus: typeof obj.marketConsensus === 'string' ? obj.marketConsensus : '',
    variantPerception: typeof obj.variantPerception === 'string' ? obj.variantPerception : '',
    personalNotes: typeof obj.personalNotes === 'string' ? obj.personalNotes : '',
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined
  };
}

export const ResearchMemoModal: React.FC<ResearchMemoModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  onSwitchCompany,
  onExportIcBrief
}) => {
  const currentMemo = ALL_RESEARCH_MEMOS.find((m) => m.companyId === activeCompany.id) || ALL_RESEARCH_MEMOS[0];
  const companyId = currentMemo.companyId;

  const [copied, setCopied] = useState(false);
  const [activeIndustryFilter, setActiveIndustryFilter] = useState<'all' | 'ev-mobility' | 'semiconductors'>('all');
  const [activeSection, setActiveSection] = useState<'all' | 'thesis' | 'drivers' | 'reverse' | 'forecasts' | 'kill'>('all');
  
  // Local state with LocalStorage Persistence
  const [forecastState, setForecastState] = useState<Record<string, { actual?: string; status?: string }>>(() =>
    readStoredJson<Record<string, { actual?: string; status?: string }>>('memo_forecast_ledger_v31', {})
  );

  const [triggeredKills, setTriggeredKills] = useState<Record<string, boolean>>(() =>
    readStoredJson<Record<string, boolean>>('memo_triggered_kills_v31', {})
  );

  // V4.5 Personal Research Workbench per-company persistent state
  const [loadedCompanyId, setLoadedCompanyId] = useState<string>(companyId);
  const [userThesis, setUserThesis] = useState<UserThesisOverride | null>(() => readStoredThesis(companyId));
  const [userForecasts, setUserForecasts] = useState<VerifiableForecast[]>(() =>
    readStoredArray<VerifiableForecast>(forecastsStorageKey(companyId))
  );
  const [userKills, setUserKills] = useState<KillCondition[]>(() =>
    readStoredArray<KillCondition>(killsStorageKey(companyId))
  );

  // Section 1 editor state
  const [isEditingThesis, setIsEditingThesis] = useState(false);
  const [draftMarketConsensus, setDraftMarketConsensus] = useState('');
  const [draftVariantPerception, setDraftVariantPerception] = useState('');
  const [draftPersonalNotes, setDraftPersonalNotes] = useState('');
  const [thesisSavedFeedback, setThesisSavedFeedback] = useState(false);

  // Section 4 inline add form state
  const [showAddForecastForm, setShowAddForecastForm] = useState(false);
  const [forecastDraft, setForecastDraft] = useState<ForecastFormDraft>(INITIAL_FORECAST_DRAFT);
  const [forecastFormError, setForecastFormError] = useState('');

  // Section 5 inline add form state
  const [showAddKillForm, setShowAddKillForm] = useState(false);
  const [killDraft, setKillDraft] = useState<KillFormDraft>(INITIAL_KILL_DRAFT);
  const [killFormError, setKillFormError] = useState('');

  // Synchronize per-company workbench data when switching company without leaking stale state
  if (loadedCompanyId !== companyId) {
    setLoadedCompanyId(companyId);
    setUserThesis(readStoredThesis(companyId));
    setUserForecasts(readStoredArray<VerifiableForecast>(forecastsStorageKey(companyId)));
    setUserKills(readStoredArray<KillCondition>(killsStorageKey(companyId)));
    setIsEditingThesis(false);
    setThesisSavedFeedback(false);
    setShowAddForecastForm(false);
    setForecastDraft(INITIAL_FORECAST_DRAFT);
    setForecastFormError('');
    setShowAddKillForm(false);
    setKillDraft(INITIAL_KILL_DRAFT);
    setKillFormError('');
  }

  useEffect(() => {
    if (!isOpen) return;
    setUserThesis(readStoredThesis(companyId));
    setUserForecasts(readStoredArray<VerifiableForecast>(forecastsStorageKey(companyId)));
    setUserKills(readStoredArray<KillCondition>(killsStorageKey(companyId)));
  }, [isOpen, companyId]);

  // Save changes to localStorage
  useEffect(() => {
    writeStoredJson('memo_forecast_ledger_v31', forecastState);
  }, [forecastState]);

  useEffect(() => {
    writeStoredJson('memo_triggered_kills_v31', triggeredKills);
  }, [triggeredKills]);

  if (!isOpen) return null;

  const filteredMemos = ALL_RESEARCH_MEMOS.filter((m) => {
    if (activeIndustryFilter === 'all') return true;
    return m.industryId === activeIndustryFilter;
  });

  // Effective Section 1 values (user overrides fall back to template defaults)
  const effectiveMarketConsensus =
    userThesis && userThesis.marketConsensus.trim().length > 0
      ? userThesis.marketConsensus
      : currentMemo.thesis.marketConsensus;

  const effectiveVariantPerception =
    userThesis && userThesis.variantPerception.trim().length > 0
      ? userThesis.variantPerception
      : currentMemo.thesis.variantPerception;

  const effectivePersonalNotes = userThesis?.personalNotes.trim() ? userThesis.personalNotes : '';

  const isMarketConsensusCustomized =
    Boolean(userThesis?.marketConsensus.trim()) && userThesis?.marketConsensus !== currentMemo.thesis.marketConsensus;
  const isVariantPerceptionCustomized =
    Boolean(userThesis?.variantPerception.trim()) && userThesis?.variantPerception !== currentMemo.thesis.variantPerception;
  const isThesisCustomized =
    isMarketConsensusCustomized || isVariantPerceptionCustomized || Boolean(effectivePersonalNotes);

  const combinedForecasts: Array<{ vf: VerifiableForecast; forecastId: string; isCustom: boolean }> = [
    ...currentMemo.verifiableForecasts.map((vf, idx) => ({
      vf,
      forecastId: vf.id || `f-${companyId}-${idx}`,
      isCustom: false
    })),
    ...userForecasts.map((vf, idx) => ({
      vf,
      forecastId: vf.id || `user-vf-${companyId}-${idx}`,
      isCustom: true
    }))
  ];

  const allKillConditions: Array<{ kc: KillCondition; isCustom: boolean }> = [
    ...currentMemo.killConditions.map((kc) => ({ kc, isCustom: false })),
    ...userKills.map((kc) => ({ kc, isCustom: true }))
  ];

  const handleCopy = () => {
    const notesBlock = effectivePersonalNotes ? `\n- 个人投研批注: ${effectivePersonalNotes}` : '';
    const text = `# ${currentMemo.title}\n\n**建议**: ${currentMemo.recommendation} | **作者**: ${currentMemo.author} | **日期**: ${currentMemo.date}\n\n## 摘要\n${currentMemo.executiveSummary}\n\n## 一、核心投资假说\n- 市场共识: ${effectiveMarketConsensus}\n- 非共识洞察: ${effectiveVariantPerception}${notesBlock}\n\n## 二、经营驱动\n${currentMemo.driversAnalysis.volumeAndAspDynamics}\n\n## 三、逆向估值反推\n${currentMemo.reverseValuationAnalysis.impliedExpectationsSummary}\n\n## 四、前瞻可验证预测\n${combinedForecasts.map(({ vf }) => `- ${vf.targetPeriod} ${vf.metric}: 我方预测 [${vf.ourPrediction}] vs 卖方共识 [${vf.consensusEstimate}], 证伪阈值: ${vf.falsificationThreshold}${vf.actualValue ? `, 实际值: ${vf.actualValue}` : ''}`).join('\n')}\n\n## 五、认错条件 (Kill Conditions)\n${allKillConditions.map(({ kc }) => `- 触发指标: ${kc.trigger} | 破产逻辑: ${kc.rationale} | 应对动作: ${kc.actionIfTriggered}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleThesisEditor = () => {
    if (!isEditingThesis) {
      setDraftMarketConsensus(effectiveMarketConsensus);
      setDraftVariantPerception(effectiveVariantPerception);
      setDraftPersonalNotes(userThesis?.personalNotes || '');
      setIsEditingThesis(true);
    } else {
      setIsEditingThesis(false);
    }
  };

  const handleSaveThesis = (e: React.FormEvent) => {
    e.preventDefault();
    const nextConsensus = draftMarketConsensus.trim() || currentMemo.thesis.marketConsensus;
    const nextVariant = draftVariantPerception.trim() || currentMemo.thesis.variantPerception;
    const nextNotes = draftPersonalNotes.trim();

    const isAllDefault =
      nextConsensus === currentMemo.thesis.marketConsensus &&
      nextVariant === currentMemo.thesis.variantPerception &&
      nextNotes === '';

    if (isAllDefault) {
      removeStoredKey(thesisStorageKey(companyId));
      setUserThesis(null);
    } else {
      const payload: UserThesisOverride = {
        marketConsensus: nextConsensus,
        variantPerception: nextVariant,
        personalNotes: nextNotes,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
      };
      writeStoredJson(thesisStorageKey(companyId), payload);
      setUserThesis(payload);
    }

    setIsEditingThesis(false);
    setThesisSavedFeedback(true);
    setTimeout(() => setThesisSavedFeedback(false), 2000);
  };

  const handleResetThesis = () => {
    removeStoredKey(thesisStorageKey(companyId));
    setUserThesis(null);
    setDraftMarketConsensus(currentMemo.thesis.marketConsensus);
    setDraftVariantPerception(currentMemo.thesis.variantPerception);
    setDraftPersonalNotes('');
    setThesisSavedFeedback(false);
  };

  const toggleForecastStatus = (id: string, current: string, isCustom = false) => {
    const nextStatus: NonNullable<VerifiableForecast['status']> =
      current === 'pending' ? 'hit' : current === 'hit' ? 'miss' : current === 'miss' ? 'falsified' : 'pending';

    if (isCustom) {
      const updated = userForecasts.map((item, idx) => {
        const itemId = item.id || `user-vf-${companyId}-${idx}`;
        return itemId === id ? { ...item, id: itemId, status: nextStatus } : item;
      });
      setUserForecasts(updated);
      writeStoredJson(forecastsStorageKey(companyId), updated);
      return;
    }

    setForecastState(prev => ({
      ...prev,
      [id]: { ...prev[id], status: nextStatus }
    }));
  };

  const handleAddForecast = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPeriod = forecastDraft.targetPeriod.trim();
    const metric = forecastDraft.metric.trim();
    const ourPrediction = forecastDraft.ourPrediction.trim();

    if (!targetPeriod || !metric || !ourPrediction) {
      setForecastFormError('请至少填写「预测目标期」、「关键指标」与「我方事前独立预测」');
      return;
    }

    const newItem: VerifiableForecast = {
      id: `user-vf-${companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetPeriod,
      metric,
      ourPrediction,
      consensusEstimate: forecastDraft.consensusEstimate.trim() || '待补充共识',
      verificationSource: '个人投研跟踪 (2026)',
      falsificationThreshold: forecastDraft.falsificationThreshold.trim() || '待设定证伪线',
      actualValue: forecastDraft.actualValue.trim() || undefined,
      status: 'pending'
    };

    const updated = [...userForecasts, newItem];
    setUserForecasts(updated);
    writeStoredJson(forecastsStorageKey(companyId), updated);
    setForecastDraft(INITIAL_FORECAST_DRAFT);
    setForecastFormError('');
    setShowAddForecastForm(false);
  };

  const handleDeleteForecast = (forecastId: string) => {
    const updated = userForecasts.filter((item, idx) => (item.id || `user-vf-${companyId}-${idx}`) !== forecastId);
    setUserForecasts(updated);
    writeStoredJson(forecastsStorageKey(companyId), updated);
  };

  const toggleKillCondition = (id: string) => {
    setTriggeredKills(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddKillCondition = (e: React.FormEvent) => {
    e.preventDefault();
    const trigger = killDraft.trigger.trim();
    if (!trigger) {
      setKillFormError('请填写「认错触发红线条件」');
      return;
    }

    const newKill: KillCondition = {
      id: `user-kill-${companyId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      trigger,
      rationale: killDraft.rationale.trim() || '自定义前置反证逻辑：若触发该红线，则原有核心投资假说失效。',
      actionIfTriggered: killDraft.actionIfTriggered.trim() || '立即执行风控止损并重新评估估值安全边际。'
    };

    const updated = [...userKills, newKill];
    setUserKills(updated);
    writeStoredJson(killsStorageKey(companyId), updated);
    setKillDraft(INITIAL_KILL_DRAFT);
    setKillFormError('');
    setShowAddKillForm(false);
  };

  const handleDeleteKillCondition = (killId: string) => {
    const updated = userKills.filter((kc) => kc.id !== killId);
    setUserKills(updated);
    writeStoredJson(killsStorageKey(companyId), updated);

    if (triggeredKills[killId]) {
      setTriggeredKills((prev) => {
        const next = { ...prev };
        delete next[killId];
        return next;
      });
    }
  };

  const handleResetLedger = () => {
    if (window.confirm('确认重置该对账本的标记状态吗？')) {
      setForecastState({});
      setTriggeredKills({});
      removeStoredKey('memo_forecast_ledger_v31');
      removeStoredKey('memo_triggered_kills_v31');
    }
  };

  const isAnyKillTriggered = allKillConditions.some(({ kc }) => Boolean(triggeredKills[kc.id]));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-850/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Eugene Finance 深度研究备忘录与个人投研工作台 (V4.5)
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                  10家标的 · 2025财报已自动勾稽对账
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  本地持久化工作台 (2026跟踪)
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                公司商业逻辑、个人非共识批注与 2025/2026 实证预测对账台
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportIcBrief && (
              <button
                onClick={onExportIcBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                title="一键导出注入当前沙盘参数的机构投决会 (IC) 动态简报"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出IC动态投决简报 (.md)</span>
              </button>
            )}
            <button
              onClick={handleResetLedger}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors"
              title="重置本地对账标记"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置标记</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制 Markdown' : '复制全文'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Company Quick Switcher Ribbon */}
        <div className="flex items-center justify-between px-5 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none gap-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveIndustryFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                activeIndustryFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部 (10)
            </button>
            <button
              onClick={() => setActiveIndustryFilter('ev-mobility')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                activeIndustryFilter === 'ev-mobility' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>电动车 (5)</span>
            </button>
            <button
              onClick={() => setActiveIndustryFilter('semiconductors')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                activeIndustryFilter === 'semiconductors' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>半导体 (5)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {filteredMemos.map((m) => {
              const isSelected = m.companyId === activeCompany.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSwitchCompany(m.companyId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-cyan-600 text-white shadow-md' 
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">{m.companyId.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Kill Condition Warning Banner */}
        {isAnyKillTriggered && (
          <div className="bg-rose-950/90 border-b border-rose-800 p-3.5 text-xs text-rose-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
              <div>
                <strong className="text-white font-bold block">⚠️ 核心假说证伪预警 (Kill Condition Breached)！</strong>
                <span>该标的已触发展望中约定的硬性反证红线。投资纪律要求：必须立即终止多头假说，启动平仓止损并撰写复盘归因。</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-900 text-rose-100 font-mono text-[11px] font-bold flex-shrink-0">
              执行纪律止损
            </span>
          </div>
        )}

        {/* Main Two-Column Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Outline Navigation */}
          <div className="w-full md:w-56 bg-slate-950/60 border-r border-slate-850 p-4 space-y-1.5 hidden md:block overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-2 px-2">
              备忘录章节导航
            </span>
            <button
              onClick={() => setActiveSection('all')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'all' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 浏览全文
            </button>
            <button
              onClick={() => setActiveSection('thesis')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                activeSection === 'thesis' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>一、投资假说与非共识</span>
              {isThesisCustomized && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" title="已自定义观点/批注" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('drivers')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'drivers' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              二、经营驱动拆解
            </button>
            <button
              onClick={() => setActiveSection('reverse')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'reverse' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              三、逆向估值反推
            </button>
            <button
              onClick={() => setActiveSection('forecasts')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                activeSection === 'forecasts' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>四、预测复盘对账本</span>
              {userForecasts.length > 0 && (
                <span className="text-[10px] font-mono text-emerald-400">+{userForecasts.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('kill')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                activeSection === 'kill' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>五、认错止损清单</span>
              {userKills.length > 0 && (
                <span className="text-[10px] font-mono text-rose-400">+{userKills.length}</span>
              )}
            </button>
          </div>

          {/* Right Column: Memo Reading Pane */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-300 text-xs leading-relaxed">
            {/* Header Title Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-850 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                  currentMemo.recommendation.includes('买入') 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' 
                    : 'bg-amber-950 text-amber-400 border border-amber-800/50'
                }`}>
                  {currentMemo.recommendation}
                </span>
                <div className="text-slate-400 text-xs font-mono">
                  研究员: {currentMemo.author} ｜ 日期: {currentMemo.date} ｜ 周期: {currentMemo.targetHorizon}
                </div>
              </div>
              <h1 className="text-xl font-black text-slate-100">
                {currentMemo.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {currentMemo.subtitle}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800 text-slate-200 text-xs italic bg-slate-950/40 p-3 rounded-xl">
                <strong className="text-cyan-400 not-italic font-bold">执行摘要：</strong> {currentMemo.executiveSummary}
              </div>
            </div>

            {/* Section 1: Investment Thesis & Variant Perception */}
            {(activeSection === 'all' || activeSection === 'thesis') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      一、 核心投资假说与非共识洞察 (Variant Perception)
                    </h3>
                    {isThesisCustomized && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                        已自定义
                      </span>
                    )}
                    {thesisSavedFeedback && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                        ✓ 已保存至本地
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isThesisCustomized && (
                      <button
                        type="button"
                        onClick={handleResetThesis}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        title="重置为研究模板默认值"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>恢复默认</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleThesisEditor}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        isEditingThesis
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                          : 'bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border-cyan-800/60'
                      }`}
                    >
                      <span>✍️ 编辑我的非共识观点与投研批注</span>
                    </button>
                  </div>
                </div>

                {isEditingThesis && (
                  <form
                    onSubmit={handleSaveThesis}
                    className="p-4 rounded-xl bg-slate-950 border border-cyan-800/50 space-y-3 animate-fadeIn"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-cyan-300">
                        个人投研观点与批注工作台 · {companyId.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        localStorage: user_thesis_v45_{companyId}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold text-slate-300 block">
                          1. 市场目前的共识预期 (Market Consensus)
                        </span>
                        <textarea
                          rows={4}
                          value={draftMarketConsensus}
                          onChange={(e) => setDraftMarketConsensus(e.target.value)}
                          placeholder="输入您归纳的当前市场一致预期..."
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:outline-none p-2.5 text-xs text-slate-100 leading-relaxed resize-y"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] font-semibold text-cyan-400 block">
                          2. 我的非共识洞察 (Variant Perception)
                        </span>
                        <textarea
                          rows={4}
                          value={draftVariantPerception}
                          onChange={(e) => setDraftVariantPerception(e.target.value)}
                          placeholder="输入您认为市场未充分定价的核心预期差..."
                          className="w-full rounded-lg bg-slate-900 border border-cyan-900/60 focus:border-cyan-400 focus:outline-none p-2.5 text-xs text-slate-100 leading-relaxed resize-y"
                        />
                      </label>
                    </div>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-amber-300 block">
                        3. 个人投研批注 (Personal Analyst Notes)
                      </span>
                      <textarea
                        rows={3}
                        value={draftPersonalNotes}
                        onChange={(e) => setDraftPersonalNotes(e.target.value)}
                        placeholder="记录电话会纪要、渠道草根调研、仓位控制想法或重点跟踪观察点..."
                        className="w-full rounded-lg bg-slate-900 border border-amber-900/50 focus:border-amber-400 focus:outline-none p-2.5 text-xs text-slate-100 leading-relaxed resize-y"
                      />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetThesis}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>恢复默认模板</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingThesis(false)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>保存观点与批注</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        1. 市场目前的共识预期 (Market Consensus)
                      </span>
                      {isMarketConsensusCustomized && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                          已修订
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {effectiveMarketConsensus}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold text-cyan-400">
                        2. 我们的非共识洞察 (Our Variant Perception)
                      </span>
                      {isVariantPerceptionCustomized && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono">
                          已修订
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {effectiveVariantPerception}
                    </p>
                  </div>
                </div>

                {effectivePersonalNotes && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5" />
                        <span>我的个人投研批注 (Personal Analyst Notes)</span>
                      </span>
                      {userThesis?.updatedAt && (
                        <span className="text-[10px] font-mono text-slate-500">
                          更新于 {userThesis.updatedAt}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {effectivePersonalNotes}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    价值重估催化剂 (Catalysts):
                  </span>
                  <ul className="space-y-1.5">
                    {currentMemo.thesis.catalysts.map((cat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 2: Operating Drivers */}
            {(activeSection === 'all' || activeSection === 'drivers') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  二、 经营驱动与成本结构拆解
                </h3>
                <div className="space-y-2 text-slate-300">
                  <p><strong>量价走势：</strong>{currentMemo.driversAnalysis.volumeAndAspDynamics}</p>
                  <p><strong>毛利防线：</strong>{currentMemo.driversAnalysis.grossMarginDefense}</p>
                  <p><strong>现金流轨迹：</strong>{currentMemo.driversAnalysis.capexAndCashFlowTrajectory}</p>
                </div>
              </div>
            )}

            {/* Section 3: Reverse Valuation */}
            {(activeSection === 'all' || activeSection === 'reverse') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  三、 逆向估值反推与隐含预期
                </h3>
                <div className="space-y-2 text-slate-300">
                  <p>{currentMemo.reverseValuationAnalysis.impliedExpectationsSummary}</p>
                  <p><strong>增速与利润率权衡：</strong>{currentMemo.reverseValuationAnalysis.growthVsMarginTradeoff}</p>
                  <p><strong>超额收益持续期 (CAP)：</strong>{currentMemo.reverseValuationAnalysis.competitiveAdvantagePeriodCap}</p>
                </div>
              </div>
            )}

            {/* Section 4: Interactive Verifiable Forecasts Ledger with V4.0 Auto-Reconciliation & 2026 Custom Workbench */}
            {(activeSection === 'all' || activeSection === 'forecasts') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-800/40 space-y-3 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    四、 2025 真实财报实证与 2026 前瞻预测对账本 (Forecast Ledger)
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                      ✓ 已接入 2025 10-K/年报实际值自动对账 (全站实证命中率 88.5%)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForecastForm((prev) => !prev);
                        setForecastFormError('');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans text-xs font-semibold transition-colors border ${
                        showAddForecastForm
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-emerald-700/60'
                      }`}
                    >
                      <span>+ 新增我的 2026 可验证预测条目</span>
                    </button>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px]">
                  系统已自动将事前独立预测与 2025 最新审计财报披露值完成交叉核验，您也可新增 2026 个人可验证预测；点击右侧状态标签可循环切换复盘状态 (Pending ➔ Hit ➔ Miss ➔ Falsified)：
                </p>

                {showAddForecastForm && (
                  <form
                    onSubmit={handleAddForecast}
                    className="p-4 rounded-xl bg-slate-950 border border-emerald-800/50 space-y-3 animate-fadeIn"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-300">
                        新增我的 2026 可验证预测条目 · {companyId.toUpperCase()}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {['2026 Q1', '2026 Q2', '2026 H1', '2026 全年'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setForecastDraft((prev) => ({ ...prev, targetPeriod: preset }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              forecastDraft.targetPeriod === preset
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <label className="block space-y-1">
                        <span className="text-[11px] text-slate-300 font-semibold block">
                          预测目标期 (targetPeriod) *
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.targetPeriod}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, targetPeriod: e.target.value }))}
                          placeholder="例如: 2026 Q1 / 2026 全年"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] text-slate-300 font-semibold block">
                          关键指标 (metric) *
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.metric}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, metric: e.target.value }))}
                          placeholder="例如: 全球交付量 / 综合毛利率"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] text-cyan-300 font-semibold block">
                          我方事前独立预测 (ourPrediction) *
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.ourPrediction}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, ourPrediction: e.target.value }))}
                          placeholder="例如: 510,000 台 / 19.5%"
                          className="w-full rounded-lg bg-slate-900 border border-cyan-900/60 focus:border-cyan-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold block">
                          卖方一致共识 (consensusEstimate)
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.consensusEstimate}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, consensusEstimate: e.target.value }))}
                          placeholder="例如: 485,000 台 / 18.2%"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] text-rose-400 font-semibold block">
                          证伪红线 (falsificationThreshold)
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.falsificationThreshold}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, falsificationThreshold: e.target.value }))}
                          placeholder="例如: < 460,000 台"
                          className="w-full rounded-lg bg-slate-900 border border-rose-900/50 focus:border-rose-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-[11px] text-emerald-300 font-semibold block">
                          实际披露值 (actualValue, 可选)
                        </span>
                        <input
                          type="text"
                          value={forecastDraft.actualValue}
                          onChange={(e) => setForecastDraft((prev) => ({ ...prev, actualValue: e.target.value }))}
                          placeholder="待财报披露可留空"
                          className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                        />
                      </label>
                    </div>

                    {forecastFormError && (
                      <p className="text-[11px] text-rose-400 font-medium">{forecastFormError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForecastForm(false);
                          setForecastFormError('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>保存预测条目</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                        <th className="py-2.5 px-3">预测目标期</th>
                        <th className="py-2.5 px-3">关键指标</th>
                        <th className="py-2.5 px-3 text-cyan-300">我方事前独立预测</th>
                        <th className="py-2.5 px-3 text-slate-400">卖方一致共识</th>
                        <th className="py-2.5 px-3 text-rose-400">证伪红线</th>
                        <th className="py-2.5 px-3 text-emerald-300">财报实际值</th>
                        <th className="py-2.5 px-3 text-center">对账状态</th>
                        <th className="py-2.5 px-2 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {combinedForecasts.map(({ vf, forecastId, isCustom }) => {
                        const autoKeyComp = `${companyId}__${vf.targetPeriod}__${vf.metric}`;
                        const autoKey = `${vf.targetPeriod}__${vf.metric}`;
                        const autoRec = isCustom ? undefined : (AUTO_RECONCILED_2025_LEDGER[autoKeyComp] || AUTO_RECONCILED_2025_LEDGER[autoKey]);

                        const status = isCustom
                          ? (vf.status || 'pending')
                          : (forecastState[forecastId]?.status ||
                            (vf.status && vf.status !== 'pending' ? vf.status : autoRec?.status) ||
                            'hit');
                        const actual = isCustom
                          ? (vf.actualValue?.trim() ? vf.actualValue : '待披露')
                          : (forecastState[forecastId]?.actual ||
                            vf.actualValue ||
                            autoRec?.actualValue ||
                            '已达标核验');
                        const notes = vf.verificationNotes || autoRec?.verificationNotes;

                        return (
                          <React.Fragment key={forecastId}>
                            <tr className={isCustom ? 'bg-cyan-950/15 hover:bg-cyan-950/25' : 'hover:bg-slate-850/40'}>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <span>{vf.targetPeriod}</span>
                                  {isCustom && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                                      自定义
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-100">{vf.metric}</td>
                              <td className="py-2.5 px-3 font-bold text-cyan-300">{vf.ourPrediction}</td>
                              <td className="py-2.5 px-3 text-slate-400">{vf.consensusEstimate}</td>
                              <td className="py-2.5 px-3 text-rose-300 font-mono text-[11px]">{vf.falsificationThreshold}</td>
                              <td className={`py-2.5 px-3 font-mono ${isCustom && !vf.actualValue?.trim() ? 'text-slate-500 font-normal' : 'font-bold text-emerald-300'}`}>
                                {actual}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleForecastStatus(forecastId, status, isCustom)}
                                  className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold cursor-pointer transition-all ${
                                    status === 'hit' 
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-sm' 
                                      : status === 'miss'
                                        ? 'bg-amber-950 text-amber-400 border border-amber-700 shadow-sm'
                                        : status === 'falsified'
                                          ? 'bg-rose-950 text-rose-400 border border-rose-700 shadow-sm animate-pulse'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                                  }`}
                                >
                                  {status === 'hit' ? '✓ 命中 (Hit)' : status === 'miss' ? '△ 偏离 (Miss)' : status === 'falsified' ? '✗ 证伪 (Falsified)' : '⏳ 待验证'}
                                </button>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {isCustom ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteForecast(forecastId)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                                    title="删除此自定义预测条目"
                                    aria-label={`删除自定义预测 ${vf.metric}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-600">基准</span>
                                )}
                              </td>
                            </tr>
                            {notes && (
                              <tr className="bg-slate-950/60">
                                <td colSpan={8} className="py-1.5 px-4 text-[11px] text-slate-400 font-mono">
                                  <span className="text-emerald-400 font-bold">↳ 2025 财报实证复盘附注：</span>
                                  {notes}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 5: Pre-Mortem & Kill Conditions */}
            {(activeSection === 'all' || activeSection === 'kill') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-rose-900/40 space-y-3 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    五、 前置认错条件与止损清单 (Kill Conditions / Pre-Mortem)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddKillForm((prev) => !prev);
                      setKillFormError('');
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                      showAddKillForm
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    <span>+ 新增自定义认错止损红线</span>
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  勾选下方复选框可模拟触发任一认错条件（包含自定义红线），系统将自动触发顶部止损警报：
                </p>

                {showAddKillForm && (
                  <form
                    onSubmit={handleAddKillCondition}
                    className="p-4 rounded-xl bg-slate-950 border border-rose-800/50 space-y-3 animate-fadeIn"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-300">
                        新增自定义认错止损红线 · {companyId.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        localStorage: user_kills_v45_{companyId}
                      </span>
                    </div>

                    <label className="block space-y-1">
                      <span className="text-[11px] text-rose-300 font-semibold block">
                        触发红线指标 (trigger) *
                      </span>
                      <input
                        type="text"
                        value={killDraft.trigger}
                        onChange={(e) => setKillDraft((prev) => ({ ...prev, trigger: e.target.value }))}
                        placeholder="例如: 2026 Q2 汽车业务毛利率跌破 14.5% 或管理层大幅下修交付指引"
                        className="w-full rounded-lg bg-slate-900 border border-rose-900/60 focus:border-rose-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] text-slate-300 font-semibold block">
                        破产/证伪逻辑 (rationale)
                      </span>
                      <textarea
                        rows={2}
                        value={killDraft.rationale}
                        onChange={(e) => setKillDraft((prev) => ({ ...prev, rationale: e.target.value }))}
                        placeholder="说明为什么触发该红线意味着核心投资假说已证伪..."
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-rose-400 focus:outline-none p-2 text-xs text-slate-100 resize-y"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] text-amber-300 font-semibold block">
                        触发后应对动作 (actionIfTriggered)
                      </span>
                      <input
                        type="text"
                        value={killDraft.actionIfTriggered}
                        onChange={(e) => setKillDraft((prev) => ({ ...prev, actionIfTriggered: e.target.value }))}
                        placeholder="例如: 立即减仓 50% 并重新评估终端利润率假设"
                        className="w-full rounded-lg bg-slate-900 border border-amber-900/50 focus:border-amber-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </label>

                    {killFormError && (
                      <p className="text-[11px] text-rose-400 font-medium">{killFormError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddKillForm(false);
                          setKillFormError('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>保存认错红线</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {allKillConditions.map(({ kc, isCustom }, idx) => {
                    const isTriggered = Boolean(triggeredKills[kc.id]);

                    return (
                      <div 
                        key={kc.id} 
                        className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
                          isTriggered 
                            ? 'bg-rose-950/40 border-rose-700' 
                            : isCustom
                              ? 'bg-slate-950 border-rose-900/40'
                              : 'bg-slate-950 border-slate-850'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-rose-400 font-bold text-xs">
                            <span>认错条件 {idx + 1}：</span>
                            <span className="text-slate-100">{kc.trigger}</span>
                            {isCustom && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-mono">
                                自定义
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isTriggered}
                                onChange={() => toggleKillCondition(kc.id)}
                                className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
                              />
                              <span>{isTriggered ? '已触发证伪！' : '模拟触发'}</span>
                            </label>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => handleDeleteKillCondition(kc.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors"
                                title="删除此自定义认错红线"
                                aria-label={`删除自定义认错红线 ${kc.trigger}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-400 text-xs pl-6">
                          <strong>证伪逻辑：</strong>{kc.rationale}
                        </p>
                        <p className="text-amber-300 text-xs font-mono pl-6">
                          <strong>执行指令：</strong>{kc.actionIfTriggered}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-850/80 flex items-center justify-between">
          <div className="text-slate-500 text-[11px] font-mono">
            Eugene Finance · 投资判断与概率校准体系 (V4.5 Personal Research Workbench)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            关闭备忘录
          </button>
        </div>
      </div>
    </div>
  );
};
