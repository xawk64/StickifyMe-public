import { Progress } from "@nextui-org/react";

export interface ProgressBarProps {
  value: number;
}

export const ProgressBar = ({ value }: ProgressBarProps) => {
  return (
    <Progress aria-label="Loading..." value={value} className="max-w-md" />
  );
};
