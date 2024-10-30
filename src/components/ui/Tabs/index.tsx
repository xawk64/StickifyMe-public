"use client";
import React from "react";
import { Tabs as TabsComponent, Tab } from "@nextui-org/react";
import { usePathname } from "next/navigation";

export interface ITabItem {
  label: string;
  href: string;
}

interface IComponentProps {
  items: ITabItem[];
  setValue: (value: ITabItem | undefined) => void;
}

const Tabs: React.FC<IComponentProps> = ({ items, setValue }) => {
  const pathname = usePathname();
  const [selected, setSelected] = React.useState(pathname);

  return (
    <TabsComponent
      aria-label="Options"
      selectedKey={selected}
      onSelectionChange={(key) => {
        key = key as string;
        setValue(items.find((item) => item.href === key));
        setSelected(key);
      }}
    >
      {items.map((item, i) => (
        <Tab
          key={item.href}
          title={item.label}
          onClick={() => setValue(item)}
        />
      ))}
    </TabsComponent>
  );
};

export default Tabs;
