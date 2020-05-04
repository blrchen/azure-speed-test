export interface HistoryModel {
  [key: string]: any[];
}

export interface LatencyTableModel {
  storageAccountName?: string;
  geography: string;
  region: string;
  location: string;
  averageLatency: number;
}
