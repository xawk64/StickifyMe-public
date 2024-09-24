import React from "react";

interface IComponentProps {
  label?: string;
  onClick: () => void;
}

const Button: React.FC<IComponentProps> = ({ label, onClick }) => {
  return (
    <button
      className="border border-solid border-purple-600 px-2"
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default Button;
