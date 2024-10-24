import React from "react";
import { RadioGroup as NextUIRadioGroup, Radio } from "@nextui-org/react";

export interface IRadioItem {
  label: string;
  value: string;
}

interface IComponentProps {
  items: IRadioItem[];
  value: IRadioItem;
  onChange: (value: IRadioItem) => void;
}

const RadioGroup: React.FC<IComponentProps> = ({ items, value, onChange }) => {
  return (
    <NextUIRadioGroup
      value={value.value}
      onValueChange={(newValue) => {
        const selectedItem = items.find((item) => item.value === newValue);
        if (selectedItem) {
          onChange(selectedItem);
        }
      }}
    >
      {items.map((item) => (
        <Radio key={item.value} value={item.value}>
          {item.label}
        </Radio>
      ))}
    </NextUIRadioGroup>
  );
};

export default RadioGroup;
