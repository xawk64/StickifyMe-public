import React from "react";
import { Switch as NextUISwitch, SwitchProps } from "@nextui-org/react";

interface CustomSwitchProps extends SwitchProps {
  label?: string;
  disabled?: boolean;
}

const Switch: React.FC<CustomSwitchProps> = ({ label, ...props }) => {
  return (
    <div className="flex items-center space-x-2">
      <NextUISwitch {...props} />
      {label && <span>{label}</span>}
    </div>
  );
};

export default Switch;
