import React, { useState, useEffect, useRef } from "react";
import Input from "../Input";
import styles from "./Table.module.scss";
import { Pagination } from "@nextui-org/react";

interface IComponentProps {
  columns?: string[];
  rows?: (string | JSX.Element)[][];
  setRows?: (value: (string | JSX.Element)[][]) => void;
  isEditable?: boolean;
  gridTemplateColumns: string;
  onRowClick?: (index: number) => void;
  itemsPerPage?: number;
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
}) => {
  const [editableCell, setEditableCell] = useState<{
    index: number;
    indexInRow: number;
  } | null>(null);

  const [currentRowHover, setCurrentRowHover] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = rows
    ? rows.slice(indexOfFirstItem, indexOfLastItem)
    : [];

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
      setRows && setRows(newRows);
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

  return rows && rows.length > 0 ? (
    <div
      className={styles.tableContainer}
      style={{
        overflowY: "auto",
      }}
    >
      <div
        ref={tableRef}
        className={styles.table}
        style={{
          ["--grid-template-columns" as any]: gridTemplateColumns,
        }}
      >
        {columns &&
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
                      onRowClick && onRowClick(indexOfFirstItem + rowIndex);
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
            total={totalPages}
            page={currentPage}
            onChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  ) : null;
};

export default Table;
