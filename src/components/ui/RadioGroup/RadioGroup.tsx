import React from "react";

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
    <div className="flex gap-6">
      {items.map((item, i) => (
        <div
          className="flex gap-2 cursor-pointer"
          key={item.value + i}
          onClick={() => onChange(item)}
        >
          <span>{item.label}</span>
          <input
            className="cursor-pointer"
            type="radio"
            checked={value.value === item.value}
          />
        </div>
      ))}
    </div>
  );
};

export default RadioGroup;
