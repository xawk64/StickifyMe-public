import { LatLngExpression } from "leaflet";
import { ICoordinates } from "./GetCoordinatesResponseType";

export interface IWarehouse {
  ID: number;
  name: string;
  address: string;
  workTime: string;
  acceptsQR: boolean;
  coordinates?: LatLngExpression;
}
