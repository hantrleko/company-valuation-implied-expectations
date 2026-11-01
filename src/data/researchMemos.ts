import { ResearchMemo } from '../types/financial';
import { TSLA_MEMO } from './memos/tslaMemo';
import { BYD_MEMO } from './memos/bydMemo';
import { LI_MEMO } from './memos/liMemo';
import { NIO_MEMO } from './memos/nioMemo';
import { XPEV_MEMO } from './memos/xpevMemo';
import { NVDA_MEMO } from './memos/nvdaMemo';
import { TSM_MEMO } from './memos/tsmMemo';
import { AMD_MEMO } from './memos/amdMemo';
import { AVGO_MEMO } from './memos/avgoMemo';
import { ASML_MEMO } from './memos/asmlMemo';

export const RESEARCH_MEMOS: Record<string, ResearchMemo> = {
  // EV Mobility
  tsla: TSLA_MEMO,
  byd: BYD_MEMO,
  li: LI_MEMO,
  nio: NIO_MEMO,
  xpev: XPEV_MEMO,
  
  // Semiconductors
  nvda: NVDA_MEMO,
  tsm: TSM_MEMO,
  amd: AMD_MEMO,
  avgo: AVGO_MEMO,
  asml: ASML_MEMO
};

export const ALL_RESEARCH_MEMOS: ResearchMemo[] = [
  TSLA_MEMO,
  BYD_MEMO,
  LI_MEMO,
  NIO_MEMO,
  XPEV_MEMO,
  NVDA_MEMO,
  TSM_MEMO,
  AMD_MEMO,
  AVGO_MEMO,
  ASML_MEMO
];
