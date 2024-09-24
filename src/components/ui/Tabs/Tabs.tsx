import React from "react";
import { Navbar } from "@nextui-org/react";

interface IComponentProps {
  items: string[];
  value: string;
  setValue: (value: string) => void;
}

const Tabs: React.FC<IComponentProps> = ({ items, value, setValue }) => {
  return (
    <Navbar isBordered variant="static" className="flex justify-center">
      <Navbar.Content>
        {items.map((item, i) => (
          <Navbar.Link
            key={i}
            onClick={() => setValue(item)}
            isActive={item === value}
          >
            {item}
          </Navbar.Link>
        ))}
      </Navbar.Content>
    </Navbar>
  );
};

export default Tabs;
