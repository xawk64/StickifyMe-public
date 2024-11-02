import { CircularProgress } from "@nextui-org/react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "danger";
}

const Loader: React.FC<LoaderProps> = ({ size = "md", color = "success" }) => (
  <CircularProgress color={color} aria-label="Loading..." size={size} />
);

export default Loader;
