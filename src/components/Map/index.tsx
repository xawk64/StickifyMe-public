import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import styles from "./map.module.scss";
import { LatLngTuple, LeafletMouseEvent } from "leaflet";
import { useEffect, useState } from "react";
import { IWarehouse } from "../../api/models/GetWarehousesResponseType";
import { warehousesList } from "./config";
import L from "leaflet";
import iconSelected from "../../assets/place-marker-selected.png";
import iconMarker from "../../assets/place-marker.png";
import Table from "../ui/Table/Table";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import Button from "../ui/Button/Button";
import warehousesAPI from "../../api/warehousesAPI";
import Select from "../ui/Select/Select";
import DateRangePicker from "../ui/DateRangePicker/DateRangePicker";
import { IWarehouseSettings } from "../../api/models/WarehouseSettings";
import { Switch } from "@nextui-org/react";

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

const Map: React.FC<IMapProps> = ({ position = [55.74, 37.61], zoom = 10 }) => {
  const [warehouses, setWarehouses] = useState<IWarehouse[]>(warehousesList);

  const [enabled, setEnabled] = useState(true);
  const [rows, setRows] = useState<(string | JSX.Element)[][]>([]);
  useEffect(() => {
    (async () => {
      const settings: IWarehouseSettings[] =
        await warehousesAPI.getWarehousesSettings();

      setWarehouses((prev) => {
        return prev.map((warehouse) => {
          const warehouseSettings = settings.find(
            ({ ID }) => ID === warehouse.ID
          );
          if (warehouseSettings) {
            console.log(warehouseSettings, "warehouseSettings");

            return {
              ...warehouse,
              ...warehouseSettings,
              dateStart: new Date(warehouseSettings.dateStart),
              dateEnd: new Date(warehouseSettings.dateEnd),
              selected: true,
            };
          }
          return warehouse;
        });
      });
      console.log(warehouses, "warehouses new!!!!");
    })();
  }, []);

  useEffect(() => {
    setRows(
      warehouses
        .filter((warehouse) => warehouse.selected)
        .map((newWarehouse, i) => [
          `${i + 1}`,
          newWarehouse.name,
          newWarehouse.address,
          <Select
            key={newWarehouse.ID}
            multiple={true}
            items={boxTypes}
            initValue={
              newWarehouse.boxTypes ? newWarehouse.boxTypes.join(",") : ""
            }
            placeholder="Выберите тип коробки"
            onChange={(value) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      boxTypes: value,
                    };
                  }
                  return warehouse;
                })
              );
            }}
          />,
          // <Select
          //   key={newWarehouse.ID}
          //   placeholder="Выберите тип коробки"
          //   selectionMode="multiple"
          //   className={styles.input}
          //   onChange={(e) => {
          //     setWarehouses((prev) =>
          //       prev.map((warehouse) => {
          //         if (warehouse.ID === newWarehouse.ID) {
          //           return {
          //             ...warehouse,
          //             boxTypes: e.target.value.split(","),
          //           };
          //         }
          //         return warehouse;
          //       })
          //     );
          //   }}
          // >
          //   {boxTypes.map((boxType) => (
          //     <SelectItem key={boxType.key}>{boxType.label}</SelectItem>
          //   ))}
          // </Select>,
          <DateRangePicker
            initValue={
              newWarehouse.dateStart && newWarehouse.dateEnd
                ? {
                    start: parseDate(
                      newWarehouse.dateStart.toISOString().split("T")[0]
                    ),
                    end: parseDate(
                      newWarehouse.dateEnd.toISOString().split("T")[0]
                    ),
                  }
                : null
            }
            key={newWarehouse.ID}
            minValue={today(getLocalTimeZone())}
            maxValue={today(getLocalTimeZone()).add({ days: 13 })}
            onChange={(value) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      dateStart: value.start.toDate("+00:00"),
                      dateEnd: value.end.toDate("+00:00"),
                    };
                  }
                  return warehouse;
                })
              );
            }}
          />,
          <Select
            key={newWarehouse.ID}
            items={coeffs}
            initValue={String(newWarehouse.coeff)}
            placeholder="Выберите коэффициент"
            onChange={(value) => {
              setWarehouses((prev) =>
                prev.map((warehouse) => {
                  if (warehouse.ID === newWarehouse.ID) {
                    return {
                      ...warehouse,
                      coeff: Number(value[0]),
                    };
                  }
                  return warehouse;
                })
              );
            }}
          />,
        ])
    );
  }, [warehouses]);

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

    setWarehouses(newWarehouses);
  };

  const onSaveWarehousesSettings = () => {
    warehousesAPI.setWarehousesSettings({
      settings: {
        items: warehouses
          .filter((warehouse) => warehouse.selected)
          .map((warehouse) => ({
            ID: warehouse.ID,
            dateStart: warehouse.dateStart,
            dateEnd: warehouse.dateEnd,
            coeff: warehouse.coeff,
            boxTypes: warehouse.boxTypes,
          })),
        enabled,
      },
    });
  };

  console.log(warehouses, "warehouses");

  return (
    <>
      <Switch isSelected={enabled} onValueChange={setEnabled}>
        Airplane mode
      </Switch>
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
    </>
  );
};

export default Map;
