import { QuarterData } from '../types/financial';
import { TSLA_DATA } from './raw/tslaData';
import { BYD_DATA } from './raw/bydData';
import { LI_DATA } from './raw/liData';
import { NIO_DATA } from './raw/nioData';
import { XPEV_DATA } from './raw/xpevData';
import { NVDA_DATA } from './raw/nvdaData';
import { TSM_DATA } from './raw/tsmData';
import { AMD_DATA } from './raw/amdData';
import { AVGO_DATA } from './raw/avgoData';
import { ASML_DATA } from './raw/asmlData';
import { FY2025_EXPANSION } from './raw/fy2025Expansion';

export const HISTORICAL_DATA: Record<string, QuarterData[]> = {
  // EV Mobility (12 Quarters + 3 Annual Reports: 2023 Q1 - 2025 FY)
  tsla: [...TSLA_DATA, ...(FY2025_EXPANSION.tsla || [])],
  byd: [...BYD_DATA, ...(FY2025_EXPANSION.byd || [])],
  li: [...LI_DATA, ...(FY2025_EXPANSION.li || [])],
  nio: [...NIO_DATA, ...(FY2025_EXPANSION.nio || [])],
  xpev: [...XPEV_DATA, ...(FY2025_EXPANSION.xpev || [])],
  
  // Semiconductors (12 Quarters + 3 Annual Reports: 2023 Q1 - 2025 FY)
  nvda: [...NVDA_DATA, ...(FY2025_EXPANSION.nvda || [])],
  tsm: [...TSM_DATA, ...(FY2025_EXPANSION.tsm || [])],
  amd: [...AMD_DATA, ...(FY2025_EXPANSION.amd || [])],
  avgo: [...AVGO_DATA, ...(FY2025_EXPANSION.avgo || [])],
  asml: [...ASML_DATA, ...(FY2025_EXPANSION.asml || [])]
};
