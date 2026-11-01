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

export const HISTORICAL_DATA: Record<string, QuarterData[]> = {
  // EV Mobility
  tsla: TSLA_DATA,
  byd: BYD_DATA,
  li: LI_DATA,
  nio: NIO_DATA,
  xpev: XPEV_DATA,
  
  // Semiconductors
  nvda: NVDA_DATA,
  tsm: TSM_DATA,
  amd: AMD_DATA,
  avgo: AVGO_DATA,
  asml: ASML_DATA
};
