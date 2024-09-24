import React from "react";

interface IComponentProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
}

const Input: React.FC<IComponentProps> = ({
  value,
  onChange,
  label,
  onBlur,
  autoFocus = false,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <span>{label}</span>}
      <input
        className="border border-solid border-purple-600"
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onBlur={onBlur}
        autoFocus={autoFocus}
      />
    </div>
  );
};

export default Input;
