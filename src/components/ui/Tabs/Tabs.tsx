import React from "react";
import { Navbar, Link } from "@nextui-org/react";

interface IComponentProps {
  items: string[];
  value: string;
  setValue: (value: string) => void;
}

const Tabs: React.FC<IComponentProps> = ({ items, value, setValue }) => {
  return (
    <Navbar isBordered variant="static" className="flex justify-center">
      <Navbar>
        {items.map((item, i) => (
          <Link
            key={i}
            onClick={() => setValue(item)}
            isActive={item === value}
          >
            {item}
          </Link>
        ))}
      </Navbar>
    </Navbar>
  );
};

export default Tabs;
