# 公司经营、估值与市场隐含预期实验室 ｜ Eugene Finance (v3.2 实时行情与财报时空版)
> **Operating Drivers, Valuation & Market-Implied Expectations Lab (v3.2)**  
> *从经营驱动推导自由现金流，反向逆推当前市场价格隐含预期 · 实时市价直连与三模时空机 · 双行业跨界覆盖 · 概率化蒙特卡洛走廊 · 研发资本化重构 · 预测复盘账本 · 全局实时遥测HUD · 悬浮交互沙盘*

---

## 一、 系统定位与升级概述 (v3.2 Overview)

本实验室已全面完成从 v1.0 至 **v3.2 实时行情与财报时空版** 的进化：
- **v3.2 实时行情直连与时空沙盘 (Live Quotes & Price Time-Machine)**：
  1. **实时行情网络直连引擎 (`liveQuoteService.ts`)**：支持中美 10 大资产实时行情直连，支持定时 30s 自动轮询与手动即时刷新，具备断网/离线优雅熔断回退机制。
  2. **三模价格时空机 (Price Time-Machine)**：
     - 🟢 **实时市价 (Live Mode)**：对齐最新二级市场盘中交易价格（如英伟达 NVDA \$178.50，市值 \$4.37T），反映当下最新交易热度与极高预期。
     - 📜 **年报基准日 (10-K Filing Benchmark)**：一键还原至 SEC 10-K 年报发布日基准价格（如 NVDA 年报基准 \$138.50，市值 \$3.39T），与财报基本面指标严格同源可比。
     - ✏️ **自定义股价 (Custom Input)**：用户可输入任意推演价格，系统毫秒级反解出该价格所需的复合增速 (CAGR)、毛利率底线与 MICAP 竞争优势期。
  3. **导航栏与 HUD 遥测联动**：顶部 Navbar 显示实时报价与日涨跌幅 Pills，HUD 遥测条内嵌时空机切换器与价格微调器。
- **v3.1 深度交互、展示与美学升级**：
  1. **暗色精密金融美学**：黑曜石磨砂玻璃质感、微弱径向聚焦光晕与高精度点阵网格，全站等宽数字防抖排印。
  2. **全局常驻实时估值与预期差遥测栏 (Live Valuation HUD)**：动态呈现市价 vs. 模型公允值双游标标尺、安全边际分位数、市场隐含销量增速与毛利率底线。
  3. **右侧悬浮实时沙盘抽屉 (Quick Sandbox Drawer)**：支持从任意阶段滑出悬浮调参面板，同屏双栏即时调整 6 大核心经营驱动，60fps 实时计算反馈。
  4. **全局 Command Palette (`Ctrl+K / ⌘K`)**：毫秒级全键盘快速跳转标的、分析阶段与 10 份深度研报。
  5. **六大阶段高密度图表重构**：Sparkline走势、瀑布重构图、单元经济学对比、现金流折现走廊、足球场估值与逆向DCF热力图。
- **v3.0 跨行业可插拔架构与生态联动**：支持「智能电动车」与「AI半导体与芯片」**双行业 10 家全球龙头** 一键切换。
- **v2.0 概率化估值与蒙特卡洛模拟**：牛市/基准/熊市加权引擎 + 1,000 次蒙特卡洛模拟公允价值概率密度走廊。
- **v1.5 财务重构严密化**：支持研发资本化还原真实经济投资资本与 NOPAT，剥离补贴与积分。

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
