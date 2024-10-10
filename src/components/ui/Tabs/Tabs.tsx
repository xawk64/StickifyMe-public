"use client";
import React from "react";
import {
  Tabs as TabsComponent,
  Tab,
  Card,
  CardBody,
  CardHeader,
} from "@nextui-org/react";
import { usePathname } from "next/navigation";

interface IComponentProps {
  items: { label: string; href: string }[];
  value: string;
  setValue: (value: string) => void;
}

const Tabs: React.FC<IComponentProps> = ({ items, value, setValue }) => {
  const pathname = usePathname();
  return (
    <TabsComponent aria-label="Options" selectedKey={pathname}>
      {items.map((item, i) => (
        <Tab key={i} title={item.label} href={item.href} />
      ))}
    </TabsComponent>
  );
};

export default Tabs;
