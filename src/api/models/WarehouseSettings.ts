export interface IWarehouseSettings {
  items: {
    ID: number;
    boxTypes: string[];
    coeff: number;
    dateStart: string;
    dateEnd: string;
  }[];
  enabled: boolean;
}
