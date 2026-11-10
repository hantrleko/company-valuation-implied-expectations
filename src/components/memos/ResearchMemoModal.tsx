import React, { useState, useEffect } from 'react';
import { X, BookOpen, Download, Copy, Check, ShieldAlert, Sparkles, Target, Compass, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Cpu, Car, Layers, RotateCcw } from 'lucide-react';
import { ResearchMemo, Company, VerifiableForecast, KillCondition } from '../../types/financial';
import { ALL_RESEARCH_MEMOS } from '../../data/researchMemos';

interface ResearchMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  onSwitchCompany: (companyId: string) => void;
}

export const ResearchMemoModal: React.FC<ResearchMemoModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  onSwitchCompany
}) => {
  const [copied, setCopied] = useState(false);
  const [activeIndustryFilter, setActiveIndustryFilter] = useState<'all' | 'ev-mobility' | 'semiconductors'>('all');
  const [activeSection, setActiveSection] = useState<'all' | 'thesis' | 'drivers' | 'reverse' | 'forecasts' | 'kill'>('all');
  
  // Local state with LocalStorage Persistence
  const [forecastState, setForecastState] = useState<Record<string, { actual?: string; status?: string }>>(() => {
    try {
      const saved = localStorage.getItem('memo_forecast_ledger_v31');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [triggeredKills, setTriggeredKills] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('memo_triggered_kills_v31');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('memo_forecast_ledger_v31', JSON.stringify(forecastState));
    } catch {}
  }, [forecastState]);

  useEffect(() => {
    try {
      localStorage.setItem('memo_triggered_kills_v31', JSON.stringify(triggeredKills));
    } catch {}
  }, [triggeredKills]);

  if (!isOpen) return null;

  const currentMemo = ALL_RESEARCH_MEMOS.find((m) => m.companyId === activeCompany.id) || ALL_RESEARCH_MEMOS[0];

  const filteredMemos = ALL_RESEARCH_MEMOS.filter((m) => {
    if (activeIndustryFilter === 'all') return true;
    return m.industryId === activeIndustryFilter;
  });

  const handleCopy = () => {
    const text = `# ${currentMemo.title}\n\n**建议**: ${currentMemo.recommendation} | **作者**: ${currentMemo.author} | **日期**: ${currentMemo.date}\n\n## 摘要\n${currentMemo.executiveSummary}\n\n## 一、核心投资假说\n- 市场共识: ${currentMemo.thesis.marketConsensus}\n- 非共识洞察: ${currentMemo.thesis.variantPerception}\n\n## 二、经营驱动\n${currentMemo.driversAnalysis.volumeAndAspDynamics}\n\n## 三、逆向估值反推\n${currentMemo.reverseValuationAnalysis.impliedExpectationsSummary}\n\n## 四、前瞻可验证预测\n${currentMemo.verifiableForecasts.map(f => `- ${f.targetPeriod} ${f.metric}: 我方预测 [${f.ourPrediction}] vs 卖方共识 [${f.consensusEstimate}], 证伪阈值: ${f.falsificationThreshold}`).join('\n')}\n\n## 五、认错条件 (Kill Conditions)\n${currentMemo.killConditions.map(k => `- 触发指标: ${k.trigger} | 破产逻辑: ${k.rationale} | 应对动作: ${k.actionIfTriggered}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleForecastStatus = (id: string, current: string) => {
    const nextStatus = current === 'pending' ? 'hit' : current === 'hit' ? 'miss' : current === 'miss' ? 'falsified' : 'pending';
    setForecastState(prev => ({
      ...prev,
      [id]: { ...prev[id], status: nextStatus }
    }));
  };

  const toggleKillCondition = (id: string) => {
    setTriggeredKills(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResetLedger = () => {
    if (window.confirm('确认重置该对账本的标记状态吗？')) {
      setForecastState({});
      setTriggeredKills({});
      localStorage.removeItem('memo_forecast_ledger_v31');
      localStorage.removeItem('memo_triggered_kills_v31');
    }
  };

  const isAnyKillTriggered = currentMemo.killConditions.some(kc => triggeredKills[kc.id]);

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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Eugene Finance 深度研究备忘录与预测复盘账本 (v3.1)
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  10 家标的 · 双行业覆盖
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                公司商业逻辑、逆向估值检验与下期可验证预测对账表
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'thesis' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              一、投资假说与非共识
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
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'forecasts' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              四、预测复盘对账本
            </button>
            <button
              onClick={() => setActiveSection('kill')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'kill' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              五、认错止损清单
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
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  一、 核心投资假说与非共识洞察 (Variant Perception)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      1. 市场目前的共识预期 (Market Consensus)
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {currentMemo.thesis.marketConsensus}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30">
                    <span className="text-[11px] font-bold text-cyan-400 block mb-1">
                      2. 我们的非共识洞察 (Our Variant Perception)
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {currentMemo.thesis.variantPerception}
                    </p>
                  </div>
                </div>

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

            {/* Section 4: Interactive Verifiable Forecasts Ledger with LocalStorage */}
            {(activeSection === 'all' || activeSection === 'forecasts') && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    四、 下期关键指标可验证预测账本 (Forecast Ledger)
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    ✓ 状态已本地自动持久化保存
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  对下一财期官方披露设立明确数值区间与反证证伪线，点击右侧标签可循环切换验证状态 (Hit ➔ Miss ➔ Falsified ➔ Pending)：
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                        <th className="py-2.5 px-3">预测目标期</th>
                        <th className="py-2.5 px-3">关键指标</th>
                        <th className="py-2.5 px-3 text-cyan-300">我方独立预测</th>
                        <th className="py-2.5 px-3 text-slate-400">卖方一致共识</th>
                        <th className="py-2.5 px-3 text-rose-400">证伪红线 (Falsification)</th>
                        <th className="py-2.5 px-3 text-slate-300">披露实际值</th>
                        <th className="py-2.5 px-3 text-center">对账复盘状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {currentMemo.verifiableForecasts.map((vf, idx) => {
                        const forecastId = vf.id || `f-${currentMemo.companyId}-${idx}`;
                        const status = forecastState[forecastId]?.status || vf.status || 'pending';
                        const actual = forecastState[forecastId]?.actual || vf.actualValue || '待披露';

                        return (
                          <tr key={forecastId} className="hover:bg-slate-850/40">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{vf.targetPeriod}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-100">{vf.metric}</td>
                            <td className="py-2.5 px-3 font-bold text-cyan-300">{vf.ourPrediction}</td>
                            <td className="py-2.5 px-3 text-slate-400">{vf.consensusEstimate}</td>
                            <td className="py-2.5 px-3 text-rose-300 font-mono text-[11px]">{vf.falsificationThreshold}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                              {actual}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => toggleForecastStatus(forecastId, status)}
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
                          </tr>
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
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  五、 前置认错条件与止损清单 (Kill Conditions / Pre-Mortem)
                </h3>
                <p className="text-slate-400 text-[11px]">
                  勾选下方复选框可模拟触发任一认错条件，系统将自动触发顶部止损警报：
                </p>

                <div className="space-y-3">
                  {currentMemo.killConditions.map((kc, idx) => {
                    const isTriggered = triggeredKills[kc.id] || false;

                    return (
                      <div 
                        key={kc.id} 
                        className={`p-3.5 rounded-xl border transition-colors space-y-1 ${
                          isTriggered 
                            ? 'bg-rose-950/40 border-rose-700' 
                            : 'bg-slate-950 border-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                            <span>认错条件 {idx + 1}：</span>
                            <span className="text-slate-100">{kc.trigger}</span>
                          </div>
                          <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isTriggered}
                              onChange={() => toggleKillCondition(kc.id)}
                              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
                            />
                            <span>{isTriggered ? '已触发证伪！' : '模拟触发'}</span>
                          </label>
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
            Eugene Finance · 投资判断与概率校准体系 (v3.1)
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
