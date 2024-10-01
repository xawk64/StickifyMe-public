import { MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import styles from "./map.module.scss";
import { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";
import { IWarehouse } from "../../api/models/GetWarehousesResponseType";
import wbAPI from "../../api/wbAPI";
import { coeffs, warehousesList } from "./config";

interface IMapProps {
  position?: LatLngExpression;
  zoom?: number;
}

const warehouseIds = [
  311895, 117456, 206708, 300987, 301229, 206968, 301760, 206348, 300862, 507,
  206298, 301805, 206236, 207404, 300711, 301809, 205985, 301920, 205349,
  207743, 300571, 301983, 205228, 205104, 302335, 208277, 686, 204952, 300363,
  204939, 302737, 209208, 204615, 300219, 209209, 1733, 203631, 302769, 209211,
  169872, 302856, 210001, 302988, 169537, 300169, 303189, 168458, 210127,
  303219, 161520, 303221, 218644, 312259, 217081, 210515, 218987, 312617,
  161003, 312807, 2737, 315199, 218698, 316646, 218916, 160030, 316879, 218732,
  317470, 321932, 117230, 323608, 218674, 324108, 158751, 117442, 210557,
  213849, 216476, 130744, 144649, 211470, 218628, 117501, 214951, 117819,
  211415, 211622, 158311, 117866, 218623, 217678, 120762, 117986, 216566,
  218616, 218402, 218225, 144154, 218210, 118535, 149445, 131643, 215020,
  140302,
];

const Map: React.FC<IMapProps> = ({ position = [55.74, 37.61], zoom = 10 }) => {
  const [warehouses, setWarehouses] = useState<IWarehouse[]>(warehousesList);

  warehouses.forEach(({ coordinates, name, address }) => {
    if (coordinates?.[0] === 0) {
      console.log(name, address);
    }
  });

  useEffect(() => {
    // (async () => {
    //   let warehouses = await wbAPI.loadWarehouses();
    //   if (warehouses) {
    //     warehouses = await Promise.all(
    //       warehouses.map(async (warehouse) => {
    //         const coordinates = await wbAPI.loadCoordinates(warehouse.address);
    //         return {
    //           ...warehouse,
    //           coordinates: [coordinates[1], coordinates[0]],
    //         };
    //       })
    //     );
    //     console.log(warehouses, warehouses);
    //     setWarehouses(warehouses);
    //   }
    // })();
  }, []);

  console.log(warehouses, "warehouses");

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      scrollWheelZoom={false}
      className={styles.root}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {warehouses.map(({ coordinates, name, address, ID }) =>
        coordinates ? (
          <Marker position={coordinates}>
            <Popup>
              {ID} <br /> {name}. <br /> {address}
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
};

export default Map;
