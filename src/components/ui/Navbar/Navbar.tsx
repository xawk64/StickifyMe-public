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
interface MenuItem {
  label: string;
  href: string;
}

interface NavbarWrapperProps {
  className?: string;
  icon?: React.ReactElement;
  menuItems: MenuItem[];
  rightSideContent?: React.ReactNode;
}

const NavbarWrapper: React.FC<NavbarWrapperProps> = ({
  icon,
  menuItems,
  rightSideContent,
}) => {
  const router = useRouter(); // Get Next.js router
  const currentPath = router.pathname; // Extract pathname from router

  return (
    <Navbar className={styles.root} isBlurred>
      <NavbarBrand>{icon}</NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {menuItems.map((item, index) => {
          const isActive = item.href === currentPath;
          return (
            <NavbarItem key={index} isActive={isActive}>
              <Link
                color="foreground"
                href={item.href}
                aria-current={isActive ? "page" : undefined}
              >
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
