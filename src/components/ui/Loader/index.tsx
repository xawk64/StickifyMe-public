import { CircularProgress } from "@nextui-org/react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  color = "success",
  className,
}) => (
  <CircularProgress
    color={color}
    aria-label="Loading..."
    size={size}
    className={className}
  />
);

export default Loader;
