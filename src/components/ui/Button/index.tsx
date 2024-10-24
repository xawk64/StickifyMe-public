import { Button as ButtonComponent, Link } from "@nextui-org/react";
import React from "react";
import styles from "./styles.module.scss";

interface IComponentProps {
  label: string;
  type?: "primary" | "secondary";
  onClick?: () => void;
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  target?: string;
}

const Button: React.FC<IComponentProps> = ({
  label,
  type = "primary",
  onClick,
  size = "md",
  href,
  className,
  disabled,
  target,
}) => {
  return (
    <div>
      <ButtonComponent
        as={href ? Link : "button"}
        color={type}
        size={size}
        onClick={onClick}
        href={href}
        target={target}
        className={`${styles[type]} ${className} ${
          disabled ? styles.disabled : ""
        }`}
        isDisabled={disabled}
      >
        {label}
      </ButtonComponent>
    </div>
  );
};

export default Button;
