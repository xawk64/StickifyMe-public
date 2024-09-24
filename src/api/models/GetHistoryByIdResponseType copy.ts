export interface IGetHistoryByIdResponse {
  withEAC: boolean;
  mode: string;
  barcodesCount: number;
  createdAt: string;
  updatedAt: string;
  rows: string[][];
  _id: string;
}
