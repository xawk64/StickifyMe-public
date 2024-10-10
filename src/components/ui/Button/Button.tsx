import { Button as ButtonComponent } from "@nextui-org/react";
import React from "react";

interface IComponentProps {
  label: string;
  type?: "primary" | "secondary";
  onClick: () => void;
}

const Button: React.FC<IComponentProps> = ({
  label,
  type = "primary",
  onClick,
}) => {
  return (
    <div>
      <ButtonComponent color={type} size="md" onClick={onClick}>
        {label}
      </ButtonComponent>
    </div>
  );
};

export default Button;
