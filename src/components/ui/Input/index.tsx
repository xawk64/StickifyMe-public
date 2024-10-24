import React from "react";
import { Input as NextUIInput } from "@nextui-org/react";

interface IComponentProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string; // Добавьте это свойство
  className?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
}

const Input: React.FC<IComponentProps> = ({
  value,
  onChange,
  label,
  onBlur,
  autoFocus = false,
  className,
  type = "text",
  isInvalid = false,
  errorMessage,
}) => {
  return (
    <NextUIInput
      value={value}
      onValueChange={onChange}
      label={label}
      onBlur={onBlur}
      autoFocus={autoFocus}
      className={className}
      type={type}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
    />
  );
};

export default Input;
