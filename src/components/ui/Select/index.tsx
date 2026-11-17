import React, { useState } from "react";
import {
  Autocomplete,
  Select as SelectComponent,
  SelectItem,
} from "@nextui-org/react";

interface IComponentProps {
  label?: string;
  initValue: string;
  onChange: (value: string[]) => void;
  placeholder: string;
  items: { key: string; label: string }[];
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
}

const Select: React.FC<IComponentProps> = ({
  label,
  initValue,
  onChange,
  items,
  multiple = false,
  placeholder,
  searchable,
  className,
}) => {
  const [value, setValue] = useState<string>(initValue);

  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;

    setValue(e.target.value);

    onChange(value.split(",").filter((value: string) => !!value));
  };

  return searchable ? (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      onChange={handleChange}
      selectedKey={value}
      onSelectionChange={(value) => {
        if (value) {
          setValue(String(value));
          onChange([String(value)]);
        }
      }}
    >
      {items.map((item) => (
        <SelectItem key={item.key} value={item.label}>
          {item.label}
        </SelectItem>
      ))}
    </Autocomplete>
  ) : (
    <SelectComponent
      label={label}
      isOpen={isOpen}
      selectionMode={multiple ? "multiple" : "single"}
      placeholder={placeholder}
      selectedKeys={value.split(",")}
      onChange={handleChange}
      className={className}
      onOpenChange={(open: boolean) => {
        if (open !== isOpen) {
          setIsOpen(open);
        }
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
