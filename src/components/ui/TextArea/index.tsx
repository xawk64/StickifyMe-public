import React from "react";
import cn from "classnames";

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  className?: string;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  errorMessage,
  isInvalid,
  className,
  rows = 5
}) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          {
            "border-red-500": isInvalid,
            "border-gray-300": !isInvalid,
          }
        )}
      />
      {errorMessage && isInvalid && (
        <span className="text-sm text-red-500">{errorMessage}</span>
      )}
    </div>
  );
};

export default TextArea; 