import React, { useState } from "react";
import {
  Select as SelectComponent,
  SelectItem,
  SharedSelection,
} from "@nextui-org/react";

interface IComponentProps {
  initValue: string;
  onChange: (value: string[]) => void;
  placeholder: string;
  items: { key: string; label: string }[];
  multiple?: boolean;
}

const Select: React.FC<IComponentProps> = ({
  initValue,
  onChange,
  items,
  multiple = false,
  placeholder,
}) => {
  const [value, setValue] = useState<string>(initValue);

  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: any) => {
    const value = e.target.value;

    console.log(value, "value");

    setValue(e.target.value);

    onChange(value.split(",").filter((value: string) => !!value));
  };

  return (
    <SelectComponent
      isOpen={isOpen}
      selectionMode={multiple ? "multiple" : "single"}
      placeholder={placeholder}
      selectedKeys={value.split(",")}
      onChange={handleChange}
      onOpenChange={(open) => {
        open !== isOpen && setIsOpen(open);
      }}
    >
      {items.map((item) => (
        <SelectItem key={item.key} value={item.label}>
          {item.label}
        </SelectItem>
      ))}
    </SelectComponent>
  );
};

export default Select;
