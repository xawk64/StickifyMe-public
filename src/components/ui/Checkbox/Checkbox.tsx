import React from "react";

interface IComponentProps {
  value: boolean;
  setValue: (value: boolean) => void;
  label?: string;
}

const Checkbox: React.FC<IComponentProps> = ({ value, setValue, label }) => {
  return (
    <div className="flex gap-1">
      <input type="checkbox" checked={value} onClick={() => setValue(!value)} />
      {label && <span>{label}</span>}
    </div>
  );
};

export default Checkbox;
