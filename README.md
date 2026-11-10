# 公司经营、估值与市场隐含预期实验室 ｜ Eugene Finance (v3.1 深度交互与美学版)
> **Operating Drivers, Valuation & Market-Implied Expectations Lab (v3.1)**  
> *从经营驱动推导自由现金流，反向逆推当前市场价格隐含预期 · 双行业跨界覆盖 · 概率化蒙特卡洛走廊 · 研发资本化重构 · 预测复盘账本 · 全局实时遥测HUD · 悬浮交互沙盘*

---

## 一、 系统定位与升级概述 (v3.1 Overview)

本实验室已全面完成从 v1.0 至 **v3.1 深度交互与美学版** 的进化：
- **v1.5 财务重构严密化**：支持一键开启 **研发资本化 (R&D Capitalization)**，自动按 3~7 年摊销期还原真实经济投资资本与 NOPAT；支持一键剥离特斯拉监管积分与车企政府补贴。
- **v2.0 概率化估值与蒙特卡洛模拟**：增加牛市/基准/熊市主观概率加权引擎，并在浏览器端毫秒级运行 **1,000 次蒙特卡洛模拟**，输出公允价值概率密度走廊与当前市价百分位。
- **v2.5 数据管道与预测复盘闭环**：提供标准 Python 采集脚本 [`scripts/ingest_sec_cninfo.py`](file:///E:/AMP/company-valuation-implied-expectations/scripts/ingest_sec_cninfo.py)，并建立 **下期可验证预测账本 (Forecast Ledger)** 与 **前置认错条件 (Pre-Mortem Kill Conditions)** 触发器。
- **v3.0 跨行业可插拔架构与生态联动**：支持「智能电动车」与「AI半导体与芯片」**双行业 10 家全球龙头** 一键切换，并与 Eugene Finance 研究主站状态总线无缝互通。
- **v3.1 深度交互、展示与美学升级**：
  1. **暗色精密金融美学**：黑曜石磨砂玻璃质感、微弱径向聚焦光晕与高精度点阵网格，全站等宽数字防抖排印。
  2. **全局常驻实时估值与预期差遥测栏 (Live Valuation HUD)**：动态呈现市价 vs. 模型公允值双游标标尺、安全边际分位数、市场隐含销量增速与毛利率底线。
  3. **右侧悬浮实时沙盘抽屉 (Quick Sandbox Drawer)**：支持从任意阶段滑出悬浮调参面板，同屏双栏即时调整 6 大核心经营驱动，60fps 实时计算反馈。
  4. **全局 Command Palette (`Ctrl+K / ⌘K`)**：毫秒级全键盘快速跳转标的、分析阶段与 10 份深度研报。
  5. **六大阶段高密度图表重构**：
     - **阶段 01**：表格内嵌 8 季度迷你 Sparkline 走势图 + 绝对值/同比(YoY)/环比(QoQ) 视图无缝切换。
     - **阶段 02**：GAAP EBIT ➔ 经济 NOPAT 重构瀑布阶梯图 + 杜邦 ROIC 树状拆解模型。
     - **阶段 03**：同业 5 强单元经济学堆叠柱状对比图 (BOM + 研发 + 渠道 + EBIT) + 行业竞争格局 2D 气泡象限图。
     - **阶段 04**：双锚点精密滑块 + 三情景主观权重联动分配器 + 10 年 FCFF 现金流与折现 PV 走廊柱线图。
     - **阶段 05**：华尔街足球场估值对比图 (Football Field) + 蒙特卡洛核密度直方图 + 龙卷风敏感性归因图 (Tornado Sensitivity)。
     - **阶段 06**：逆向 DCF 等高线热力矩阵 (支持点击任意单元格一键载入模型) + 预期差向量 (Expectation Gap Vector) + 动态 MICAP 优势期衰退曲线图。
  6. **研报阅读器与审计抽屉升级**：双栏沉浸式阅读器、预测对账单支持浏览器 LocalStorage 本地状态持久化、仿真 SEC 10-K / 巨潮报告原文切片。

---

## 二、 覆盖行业与 10 家标的资产矩阵

| 行业领域 | 代表性龙头 (5家) | 核心物理量价驱动指标 | 官方披露信源 |
| :--- | :--- | :--- | :--- |
| **01 智能电动汽车与出行科技** | • **特斯拉 (TSLA)**<br>• **比亚迪 (002594.SZ)**<br>• **理想汽车 (LI)**<br>• **蔚来 (NIO)**<br>• **小鹏汽车 (XPEV)** | 交付量 (台) × 单车销售均价 (ASP) － 单车制造成本 (BOM + 折旧) | SEC EDGAR (10-K, 10-Q, 20-F) & 巨潮资讯 (A股年度/半年度/季度报告) |
| **02 全球半导体与AI算力芯片** | • **英伟达 (NVDA)**<br>• **台积电 (TSM)**<br>• **超威半导体 (AMD)**<br>• **博通 (AVGO)**<br>• **阿斯麦 (ASML)** | 等效晶圆出货量 (千片) / 算力芯片出货 (千颗) × 单元 ASP (USD/EUR) | SEC EDGAR (10-K, 10-Q, 20-F, 6-K) |

- **历史数据跨度**：所有 10 家公司均录入 **2023 Q1 至 2024 Q4 连续 8 个季度** + **FY2023、FY2024 完整年报**。
- **全量审计可追溯**：点击表格任一单元格均可打开 [`DisclosureDrawer`](file:///E:/AMP/company-valuation-implied-expectations/src/components/DisclosureDrawer.tsx)，查看官方披露 Accession No.、科目分部与原文引用。

---

## 三、 六阶分析链条与算法内核

```
01 原始披露 ➔ 02 财务重构 ➔ 03 经营驱动 ➔ 04 情景预测 ➔ 05 估值区间 ➔ 06 市场隐含预期
```

### 1. 动态求解隐含竞争优势期 (MICAP Fade Model)
采用 Mauboussin 竞争均衡衰退模型，假设企业在 $N$ 年内享有 $\text{ROIC} > \text{WACC}$ 的超额回报；$N$ 年后增量回报率向资本成本均值回归（$\text{ROIIC} = \text{WACC}$），再投资不再产生超额净现值。系统通过数值求根反解出当前股价对应的精确 $N$ 年，并输出年化衰退路径：
$$\text{EV} = \sum_{t=1}^{N} \frac{\text{FCFF}_t}{(1+\text{WACC})^t} + \frac{\text{NOPAT}_{N+1}}{\text{WACC} \cdot (1+\text{WACC})^N}$$

### 2. 蒙特卡洛模拟 (Monte Carlo Simulation - 1,000次抽样)
对未来销量增速、稳态毛利率与 WACC 施加正态扰动抽样，直观输出：
- 低估悲观边界 P10
- 中位数公允价值 P50
- 高估乐观边界 P90
- **当前市场价格所处分位点**（例如：当前市价处于第 72 百分位，直观展示定价拥挤度）。

---

## 四、 交付成果：10 份深度研究备忘录与预测复盘账本

点击顶部【10 份深度研报与预测账本】，可直接调阅所有 10 份研报全文。备忘录支持交互式标记：
- **下期可验证预测账本**：可将预测状态切换为 `✓ 命中 (Hit)`、`△ 偏离 (Miss)` 或 `✗ 证伪 (Falsified)`。
- **前置认错条件模拟触发**：勾选认错条款可立即触发顶部醒目的 `⚠️ 核心假说证伪预警`，严守投资纪律。

---

## 五、 本地运行与测试指南

```bash
# 进入工程目录
cd E:\AMP\company-valuation-implied-expectations

# 运行自动化算法单元测试 (DCF/MICAP/逆向求根)
npm test
# ▶ DCF & Reverse DCF v3.0 Solver Unit Tests
#   ✔ Forward DCF calculates positive Enterprise & Equity value
#   ✔ Reverse DCF Solver converges to match target market cap within 1%
#   ✔ Dynamic MICAP Solver produces reasonable Competitive Advantage Period
# ℹ pass 4, fail 0

# 运行半自动披露采集测试
python scripts/ingest_sec_cninfo.py TSLA

# 启动交互开发服务器 (默认端口 5176)
npm run dev

# 生产环境打包
npm run build
```
