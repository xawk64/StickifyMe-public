import { LatLngTuple } from "leaflet";

export interface IWarehouse {
  ID: number;
  name: string;
  address: string;
  workTime: string;
  acceptsQR: boolean;
  coordinates?: LatLngTuple;
  selected?: boolean;
  boxTypes?: string[];
  coeff?: number;
  dateStart?: string;
  dateEnd?: string;
}
