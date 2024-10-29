import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { useRouter } from "next/router"; // Import useRouter hook from next/router
import Link from "next/link";
import styles from "./styles.module.scss";
import Image, { StaticImageData } from "next/image";
export interface MenuItem {
  label: string;
  href: string;
  iconHref?: StaticImageData;
  target?: string;
}

interface NavbarWrapperProps {
  className?: string;
  icon?: React.ReactElement;
  menuItems: MenuItem[];
  menuClassName?: string;
  rightSideContent?: React.ReactNode;
}

const NavbarWrapper: React.FC<NavbarWrapperProps> = ({
  className,
  icon,
  menuItems,
  menuClassName,
  rightSideContent,
}) => {
  const router = useRouter(); // Get Next.js router

  const currentPath = router.pathname; // Extract pathname from router

  return (
    <Navbar
      className={styles.root + " " + className}
      isBlurred
      disableAnimation={true}
    >
      <NavbarBrand>{icon}</NavbarBrand>
      <NavbarContent
        className={`hidden sm:flex gap-4 ${menuClassName}`}
        justify="center"
      >
        {menuItems.map((item, index) => {
          const isActive = item.href === currentPath;
          return (
            <NavbarItem key={index} isActive={isActive}>
              <Link
                color="foreground"
                href={item.href}
                target={item.target}
                aria-current={isActive ? "page" : undefined}
                className="flex gap-2 items-center"
              >
                {item.iconHref && (
                  <Image
                    src={item.iconHref}
                    alt={item.label}
                    width={32}
                    height={32}
                  />
                )}
                {item.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>
      <NavbarContent justify="end">{rightSideContent}</NavbarContent>
    </Navbar>
  );
};

export default NavbarWrapper;
