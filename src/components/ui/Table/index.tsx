import React, { useState, useEffect, useRef } from "react";
import Input from "../Input";
import styles from "./Table.module.scss";
import { Pagination, Card, Skeleton } from "@nextui-org/react";
import Loader from "../Loader";

interface IComponentProps {
  columns?: string[];
  rows?: (string | JSX.Element)[][];
  setRows?: (value: (string | JSX.Element)[][]) => void;
  isEditable?: boolean;
  gridTemplateColumns: string;
  onRowClick?: (index: number) => void;
  itemsPerPage?: number;
  isLoading?: boolean;
}

interface EditCellTextProps {
  defaultValue: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
}

const EditCellText: React.FC<EditCellTextProps> = ({
  defaultValue,
  onChangeText,
  onBlur,
}) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <Input
      value={value}
      onChange={(value) => {
        onChangeText(value);
        setValue(value);
      }}
      onBlur={onBlur}
      autoFocus
    />
  );
};

const Table: React.FC<IComponentProps> = ({
  columns,
  rows,
  setRows,
  isEditable,
  gridTemplateColumns,
  onRowClick,
  itemsPerPage = 10,
  isLoading = false,
}) => {
  isEditable = false;
  const [editableCell, setEditableCell] = useState<{
    index: number;
    indexInRow: number;
  } | null>(null);

  const [currentRowHover, setCurrentRowHover] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isMobile, setIsMobile] = useState(false);
  const [isCard, setIsCard] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Проверяем количество колонок для карточного вида
      const columnsCount = gridTemplateColumns.split(" ").length;
      setIsCard(mobile && columnsCount < 8);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [gridTemplateColumns]);

  // Изменяем количество элементов на странице для мобильных
  const effectiveItemsPerPage = isMobile ? 5 : itemsPerPage;

  const indexOfLastItem = currentPage * effectiveItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - effectiveItemsPerPage;
  const currentItems = rows
    ? rows.slice(indexOfFirstItem, indexOfLastItem)
    : [];

  // Добавляем стили для карточного вида
  const cardStyles = isCard
    ? {
        display: "flex",
        flexDirection: "column" as const,
        gap: "1rem",
        padding: "1rem",
      }
    : {};

  const onChangeCellText = (
    newValue: string,
    index: number,
    indexInRow: number
  ) => {
    if (rows) {
      const actualIndex = indexOfFirstItem + index;
      const newRows = rows.map((row, i) => {
        if (i === actualIndex) {
          return row.map((value, valueIndex) => {
            if (valueIndex === indexInRow) {
              return newValue;
            }
            return value;
          });
        }
        return row;
      });
      setRows?.(newRows);
    }
  };

  const tableRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState("auto");

  useEffect(() => {
    const updateTableHeight = () => {
      if (tableRef.current) {
        const windowHeight = window.innerHeight;
        const tableTop = tableRef.current.getBoundingClientRect().top;
        const paginationHeight = 60; // Примерная высота пагинации
        const newHeight = windowHeight - tableTop - paginationHeight;
        setTableHeight(`${newHeight}px`);
      }
    };

    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);

    return () => {
      window.removeEventListener("resize", updateTableHeight);
    };
  }, []);

  const totalPages = Math.ceil((rows?.length || 0) / itemsPerPage);

  useEffect(() => {
    if (totalPages && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const renderSkeleton = () => {
    return <Loader className={styles.skeleton} />;
  };

  if (isLoading) {
    return renderSkeleton();
  }

  return rows && rows.length > 0 ? (
    <div
      className={styles.tableContainer}
      style={{
        overflowY: "auto",
      }}
    >
      <div
        ref={tableRef}
        className={`${styles.table} ${isCard ? styles.cardView : ""}`}
        style={{
          ["--grid-template-columns" as any]: isCard
            ? "1fr"
            : gridTemplateColumns,
          ...cardStyles,
        }}
      >
        {isCard
          ? // Карточный вид для мобильных
            currentItems.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={styles.card}
                onClick={() =>
                  onRowClick && onRowClick(indexOfFirstItem + rowIndex)
                }
              >
                {columns &&
                  columns.map((column, colIndex) => (
                    <div key={colIndex} className={styles.cardItem}>
                      <div className={styles.cardLabel}>{column}</div>
                      <div className={styles.cardValue}>{row[colIndex]}</div>
                    </div>
                  ))}
              </div>
            ))
          : // Обычный табличный вид
            columns &&
            columns.length > 0 &&
            columns.map((column, i) => {
              return (
                <div key={i} className={styles.column}>
                  <div className={`${styles.cell} ${styles.header}`}>
                    <div className={`${styles.cell} ${styles.text}`}>
                      {column}
                    </div>
                  </div>
                  {currentItems.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={`${styles.cell} ${styles.content} ${
                        currentRowHover === rowIndex ? styles.active : ""
                      }`}
                      onClick={() => {
                        setEditableCell({
                          index: i,
                          indexInRow: rowIndex,
                        });
                        onRowClick?.(indexOfFirstItem + rowIndex);
                      }}
                      onMouseMove={() => setCurrentRowHover(rowIndex)}
                      onMouseLeave={() => setCurrentRowHover(null)}
                    >
                      {isEditable &&
                      editableCell?.index === i &&
                      editableCell.indexInRow === rowIndex &&
                      typeof row[i] === "string" ? (
                        <EditCellText
                          defaultValue={row[i] as string}
                          onChangeText={(value) =>
                            onChangeCellText(value, rowIndex, i)
                          }
                          onBlur={() => setEditableCell(null)}
                        />
                      ) : (
                        <div className={`${styles.cell} ${styles.text}`}>
                          {row[i]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
      </div>
      {rows && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            total={Math.ceil(rows.length / effectiveItemsPerPage)}
            page={currentPage}
            onChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  ) : null;
};

export default Table;
