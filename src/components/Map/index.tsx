import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import styles from "./map.module.scss";
import {
  LatLngExpression,
  LatLngTuple,
  LeafletMouseEvent,
  icon,
} from "leaflet";
import { useEffect, useState } from "react";
import { IWarehouse } from "../../api/models/GetWarehousesResponseType";
import wbAPI from "../../api/wbAPI";
import { warehousesList } from "./config";
import L from "leaflet";
import iconSelected from "../../assets/place-marker-selected.png";
import iconMarker from "../../assets/place-marker.png";
import Table from "../ui/Table/Table";
import { DateRangePicker } from "@nextui-org/react";
import { Select, SelectSection, SelectItem } from "@nextui-org/react";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { add } from "date-fns";
import Button from "../ui/Button/Button";
import warehousesAPI from "../../api/warehousesAPI";

interface IMapProps {
  position?: LatLngTuple;
  zoom?: number;
}

const columns = [
  "№",
  "Название",
  "Адрес",
  "Тип коробки",
  "Дата отгрузки",
  "Коэффициент",
];

const coeffs = [
  { key: "0", label: "Бесплатно" },
  { key: "1", label: "x1" },
  { key: "2", label: "x2" },
  { key: "3", label: "x3" },
  { key: "4", label: "x4" },
  { key: "5", label: "x5" },
  { key: "6", label: "x6" },
  { key: "7", label: "x7" },
  { key: "8", label: "x8" },
  { key: "9", label: "x9" },
  { key: "10", label: "x10" },
];

const boxTypes = [
  { key: "Короба", label: "Короба" },
  { key: "Монопаллеты", label: "Монопаллеты" },
  { key: "Суперсейф", label: "Суперсейф" },
  { key: "QR-поставка с коробами", label: "QR-поставка с коробами" },
];

const gridTemplateColumns = "30px 200px 400px 200px 230px 200px";

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
  const [rows, setRows] = useState<(string | JSX.Element)[][]>([]);
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

  const handleClickByMarker = (e: LeafletMouseEvent) => {
    const newWarehouses = warehouses.map((warehouse) => {
      if (
        warehouse.coordinates?.[0] === e.latlng.lat &&
        warehouse.coordinates?.[1] === e.latlng.lng
      ) {
        return { ...warehouse, selected: !warehouse.selected };
      }
      return warehouse;
    });

    setRows(
      newWarehouses
        .filter((warehouse) => warehouse.selected)
        .map((newWarehouse, i) => [
          `${i + 1}`,
          newWarehouse.name,
          newWarehouse.address,
          <Select
            key={i}
            placeholder="Выберите тип коробки"
            selectionMode="multiple"
            className={styles.input}
            onChange={(e) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      boxTypes: e.target.value.split(","),
                    };
                  }
                  return warehouse;
                })
              );
            }}
          >
            {boxTypes.map((boxType) => (
              <SelectItem key={boxType.key} onChange>
                {boxType.label}
              </SelectItem>
            ))}
          </Select>,
          <DateRangePicker
            key={i}
            className={styles.input}
            minValue={today(getLocalTimeZone())}
            maxValue={today(getLocalTimeZone()).add({ days: 13 })}
            labelPlacement="outside-left"
            onChange={(value) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      dateStart: value.start.toDate(getLocalTimeZone()),
                      dateEnd: value.end.toDate(getLocalTimeZone()),
                    };
                  }
                  return warehouse;
                })
              );
            }}
          />,
          <Select
            key={i}
            placeholder="Выберите коэффициент"
            className={styles.input}
            onChange={(e) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      coeff: Number(e.target.value),
                    };
                  }
                  return warehouse;
                })
              );
            }}
          >
            {coeffs.map((coeff) => (
              <SelectItem key={coeff.key}>{coeff.label}</SelectItem>
            ))}
          </Select>,
        ])
    );

    setWarehouses(newWarehouses);
    console.log("marker clicked", e.latlng);
  };

  const onSaveWarehousesSettings = () => {
    warehousesAPI.setWarehousesSettings({
      settings: {
        items: warehouses
          .filter((warehouse) => warehouse.selected)
          .map((warehouse) => ({
            ID: warehouse.ID,
            startDate: warehouse.dateStart,
            endDate: warehouse.dateEnd,
            coeff: warehouse.coeff,
            boxTypes: warehouse.boxTypes,
          })),
      },
    });
  };

  console.log(warehouses, "warehouses");

  return (
    <div className={styles.root}>
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {warehouses.map(({ coordinates, name, address, ID, selected }) =>
          coordinates ? (
            <Marker
              position={coordinates}
              eventHandlers={{
                click: handleClickByMarker,
                mouseover: (event) => event.target.openPopup(),
              }}
              icon={L.divIcon({
                iconSize: [32, 32],
                iconAnchor: [32 / 2, 32 + 9],
                className: "mymarker",
                html: `<img src=${
                  selected ? iconSelected.src : iconMarker.src
                }></img>`,
              })}
            >
              <Popup>
                {ID} <br /> {name}. <br /> {address}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
      <div className={styles.table}>
        <Table
          rows={rows}
          setRows={setRows}
          columns={columns}
          gridTemplateColumns={gridTemplateColumns}
          isEditable
        />
        <Button
          onClick={onSaveWarehousesSettings}
          label="Сохранить настройки"
        />
      </div>
    </div>
  );
};

export default Map;
