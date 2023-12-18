import { ScreenedStockResult } from "./screened-stock-result";

export interface ScreenerResult {
    Data: ScreenedStockResult[],
    TotalData: number;
    TotalDataFiltered: number;
  }