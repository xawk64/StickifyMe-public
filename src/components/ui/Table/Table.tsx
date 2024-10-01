import React, { useState } from "react";
import Input from "../Input/Input";
import styles from "./Table.module.scss";
import { Table as TableNextGui } from "@nextui-org/react";

interface IComponentProps {
  columns?: string[];
  rows?: (string | JSX.Element)[][];
  setRows?: (value: (string | JSX.Element)[][]) => void;
  isEditable?: boolean;
  gridTemplateColumns: string;
  onRowClick?: (index: number) => void;
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
}) => {
  const [editableCell, setEditableCell] = useState<{
    index: number;
    indexInRow: number;
  } | null>(null);

  const [currentRowHover, setCurrentRowHover] = useState<number | null>(null);

  const onChangeCellText = (
    newValue: string,
    index: number,
    indexInRow: number
  ) => {
    if (rows) {
      const newRows = rows.map((row, i) => {
        if (i === index) {
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

  return (
    <div
      className={styles.table}
      style={{ ["--grid-template-columns" as any]: gridTemplateColumns }}
    >
      {columns &&
        columns.length > 0 &&
        columns.map((column, i) => {
          return (
            <div key={i} className={styles.column}>
              <div className={`${styles.cell} ${styles.header}`}>
                <div className={`${styles.cell} ${styles.text}`}>{column}</div>
              </div>
              {rows &&
                rows.length > 0 &&
                rows.map((row, rowIndex) => (
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
                      onRowClick && onRowClick(rowIndex);
                    }}
                    onMouseMove={() => setCurrentRowHover(rowIndex)}
                    onMouseLeave={() => setCurrentRowHover(null)}
                  >
                    {isEditable &&
                    editableCell?.index === i &&
                    editableCell.indexInRow === rowIndex &&
                    typeof row[i] === "string" ? (
                      <EditCellText
                        defaultValue={rows[rowIndex][i] as string}
                        onChangeText={(value) =>
                          onChangeCellText(value, rowIndex, i)
                        }
                        onBlur={() => setEditableCell(null)}
                      />
                    ) : (
                      <div className={`${styles.cell} ${styles.text}`}>
                        {rows[rowIndex][i]}
                      </div>
                    )}{" "}
                  </div>
                ))}
            </div>
          );
        })}
    </div>
  );
};

export default Table;
