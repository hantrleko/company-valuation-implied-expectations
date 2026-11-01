import React from 'react';
import { FileSearch, Calculator, Gauge, Sliders, DollarSign, Target } from 'lucide-react';

export type StageId = 'disclosures' | 'reconstruction' | 'drivers' | 'scenarios' | 'valuation' | 'market-implied';

interface StageNavigatorProps {
  currentStage: StageId;
  onSelectStage: (stage: StageId) => void;
}

export const STAGES = [
  {
    id: 'disclosures' as StageId,
    num: '01',
    label: '原始披露',
    enLabel: 'Raw Disclosures',
    desc: '8季度财报与SEC/巨潮穿透',
    icon: FileSearch
  },
  {
    id: 'reconstruction' as StageId,
    num: '02',
    label: '财务重构',
    enLabel: 'Financial Reconstruction',
    desc: 'NOPAT/ROIC与经济利润',
    icon: Calculator
  },
  {
    id: 'drivers' as StageId,
    num: '03',
    label: '经营驱动',
    enLabel: 'Operating Drivers',
    desc: '单车量价/毛利与横向对标',
    icon: Gauge
  },
  {
    id: 'scenarios' as StageId,
    num: '04',
    label: '情景预测',
    enLabel: 'Scenario Forecasting',
    desc: '交互滑块与10年自由现金流',
    icon: Sliders
  },
  {
    id: 'valuation' as StageId,
    num: '05',
    label: '估值区间',
    enLabel: 'Valuation Range',
    desc: '内在价值与存量/增长拆解',
    icon: DollarSign
  },
  {
    id: 'market-implied' as StageId,
    num: '06',
    label: '市场隐含预期',
    enLabel: 'Market Expectations',
    desc: '逆向DCF求解与认错条件',
    icon: Target,
    highlight: true
  }
];

export const StageNavigator: React.FC<StageNavigatorProps> = ({
  currentStage,
  onSelectStage
}) => {
  return (
    <div className="bg-slate-900/90 border-y border-slate-800 backdrop-blur-md sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center overflow-x-auto py-2.5 gap-2 scrollbar-none">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = currentStage === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => onSelectStage(stage.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all flex-shrink-0 group ${
                    isActive
                      ? stage.highlight
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                        : 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-md'
                      : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold ${
                        isActive ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        {stage.num}
                      </span>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {stage.label}
                      </span>
                      {stage.highlight && !isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                          核心
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate max-w-[130px] hidden md:block ${
                      isActive ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {stage.desc}
                    </div>
                  </div>
                </button>
                {idx < STAGES.length - 1 && (
                  <div className="text-slate-700 select-none flex-shrink-0 text-xs">➔</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
