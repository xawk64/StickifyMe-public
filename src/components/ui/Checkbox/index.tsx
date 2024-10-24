import React from "react";
import { Checkbox as NextUICheckbox } from "@nextui-org/react";

interface IComponentProps {
  value: boolean;
  setValue: (value: boolean) => void;
  label?: string;
}

const Checkbox: React.FC<IComponentProps> = ({ value, setValue, label }) => {
  return (
    <NextUICheckbox isSelected={value} onValueChange={setValue}>
      {label}
    </NextUICheckbox>
  );
};

export default Checkbox;
