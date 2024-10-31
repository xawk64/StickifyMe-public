import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import styles from "./styles.module.scss";
import { LatLngExpression, LatLngTuple, LeafletMouseEvent } from "leaflet";
import { useEffect, useState } from "react";
import { IWarehouse } from "../../../api/models/GetWarehousesResponseType";
import { warehousesList } from "./config";
import L from "leaflet";
import iconSelected from "../../../assets/place-marker-selected.png";
import iconMarker from "../../../assets/place-marker.png";
import Table from "../../ui/Table";
import { getLocalTimeZone, today, parseDate } from "@internationalized/date";
import Button from "../../ui/Button";
import warehousesAPI from "../../../api/warehousesAPI";
import Select from "../../ui/Select";
import DateRangePicker from "../../ui/DateRangePicker";
import { IWarehouseSettings } from "../../../api/models/WarehouseSettings";
import Switch from "../../ui/Switch";
import { useStore } from "../../../store";
import { toast } from "react-toastify";
import { useRouter } from 'next/router';
import { observer } from "mobx-react-lite";

interface IWarehousesMonitoring {
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
];

const boxTypes = [
  { key: "Короба", label: "Короба" },
  { key: "Монопаллеты", label: "Монопаллеты" },
  { key: "Суперсейф", label: "Суперсейф" },
  { key: "QR-поставка с коробами", label: "QR-поставка с коробами" },
];

const gridTemplateColumns = "30px 200px 400px 200px 230px 200px";

const WarehousesMonitoring: React.FC<IWarehousesMonitoring> = observer(({
  position = [55.74, 37.61],
  zoom = 10,
}) => {
  const { authStore } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!authStore.state.emailVerification) {
      toast.error('Для доступа к мониторингу складов необходимо подтвердить email');
      router.push('/settings');
    }
  }, [authStore.state.emailVerification]);

  if (!authStore.state.emailVerification) {
    return null;
  }

  const [warehouses, setWarehouses] = useState<IWarehouse[]>(warehousesList);
  7;

  const [isToSave, setIsToSave] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [rows, setRows] = useState<(string | JSX.Element)[][]>([]);
  useEffect(() => {
    (async () => {
      const settings: IWarehouseSettings =
        await warehousesAPI.getWarehousesSettings();

      setEnabled(settings.enabled);
      setWarehouses((prev) => {
        return prev.map((warehouse) => {
          const warehouseSettings = settings.items.find(
            ({ ID }) => ID === warehouse.ID
          );
          if (warehouseSettings) {
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
    setIsToSave(true);
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

  const onSaveWarehousesSettings = async () => {
    try {
      const selectedWarehouses = warehouses.filter((warehouse) => warehouse.selected);
      
      // Проверяем все обязательные поля
      const hasInvalidFields = selectedWarehouses.some(
        (warehouse) => 
          !warehouse.dateStart || 
          !warehouse.dateEnd || 
          !warehouse.boxTypes?.length || 
          warehouse.coeff === undefined || 
          warehouse.coeff === null
      );

      if (hasInvalidFields) {
        toast.error("Необходимо заполнить все поля (даты, тип коробки и коэффициент) для выбранных складов");
        return;
      }

      await warehousesAPI.setWarehousesSettings({
        settings: {
          items: selectedWarehouses.map((warehouse) => ({
            ID: warehouse.ID,
            dateStart: warehouse.dateStart,
            dateEnd: warehouse.dateEnd,
            coeff: warehouse.coeff,
            boxTypes: warehouse.boxTypes,
          })),
          enabled,
        },
      });
      toast.success("Настройки успешно сохранены");
      setIsToSave(false);
    } catch (error) {
      toast.error("Ошибка при сохранении настроек");
    }
  };

  const handleChangeEnabled = (value: boolean) => {
    setIsToSave(true);
    setEnabled(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <Switch
        isSelected={enabled}
        onValueChange={handleChangeEnabled}
        label="Включить мониторинг"
      />
      <div className={styles.root}>
        <MapContainer
          center={position as LatLngExpression}
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
        </div>
      </div>
      <div className={styles.footer}>
        <Button
          onClick={onSaveWarehousesSettings}
          label="Сохранить настройки"
          disabled={!isToSave}
        />
      </div>
    </div>
  );
});

export default WarehousesMonitoring;
