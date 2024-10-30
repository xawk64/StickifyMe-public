import React, { useState } from "react";
import { Input as NextUIInput } from "@nextui-org/react";
import { UnLockIcon } from "../Icons/UnlockIcon";
import { LockIcon } from "../Icons/LockIcon";

interface IComponentProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  placeholder?: string;
}

const Input: React.FC<IComponentProps> = ({
  value,
  onChange,
  label,
  onBlur,
  autoFocus = false,
  className,
  type = "text",
  isInvalid,
  errorMessage,
  placeholder,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const endContent = type === "password" && (
    <button
      className="focus:outline-none"
      type="button"
      onClick={togglePasswordVisibility}
    >
      {!showPassword ? (
        <UnLockIcon fill="currentColor" />
      ) : (
        <LockIcon fill="currentColor" />
      )}
    </button>
  );

  return (
    <NextUIInput
      value={value}
      onValueChange={onChange}
      label={label}
      onBlur={onBlur}
      autoFocus={autoFocus}
      className={className}
      type={type === "password" && showPassword ? "text" : type}
      isInvalid={isInvalid !== undefined ? isInvalid : !!errorMessage}
      errorMessage={errorMessage}
      placeholder={placeholder}
      endContent={endContent}
    />
  );
};

export default Input;
