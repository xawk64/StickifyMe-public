import NavbarWrapper, { MenuItem } from "../ui/Navbar";
import { useStore } from "../../store";
import { RequestStatus } from "../../store/enums";
import User from "../ui/User";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import headerLogo from "../../assets/header_logo.png";
import Button from "../ui/Button";
import { PAGES, PROTECTED_PAGES, PROTECTED_PAGES_WB } from "../../config/pages";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

const menuItemsDefault: MenuItem[] = [
  { label: "Импорт", href: "/imports" },
  { label: "Телеграм бот", href: "/telegram-bot" },
  { label: "Настройки", href: "/settings" },
  { label: "Поддержка", href: "/support" },
];

interface LayoutProps {
  children: React.ReactNode;
  menuItems?: MenuItem[];
  menuClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const Layout: React.FC<LayoutProps> = observer(
  ({
    children,
    contentClassName,
    menuItems,
    headerClassName,
    menuClassName,
  }) => {
    const {
      authStore: {
        status,
        state: { fullName, id: userId, avatarUrl, wbApiKey, emailVerification },
      },
    } = useStore();

    const router = useRouter();

    useEffect(() => {
      if (
        (status === RequestStatus.success || status === RequestStatus.error) &&
        !userId &&
        PROTECTED_PAGES.includes(router.pathname)
      ) {
        router.push(PAGES.AUTH);
      }
      if (
        status === RequestStatus.success &&
        userId &&
        (!wbApiKey || !emailVerification) &&
        PROTECTED_PAGES_WB.includes(router.pathname)
      ) {
        router.push("/settings");
      }
    }, [userId, status, router.pathname]);

    menuItems = userId
      ? !wbApiKey || !emailVerification
        ? menuItems || [
            { label: "Настройки", href: "/settings" },
            { label: "Поддержка", href: "/support" },
          ]
        : menuItems || menuItemsDefault
      : menuItems || [];

    return (
      <>
        <NavbarWrapper
          className={headerClassName}
          icon={
            <Link href={"/"}>
              <Image src={headerLogo} alt="logo" width={65} height={39} />
            </Link>
          }
          menuItems={menuItems}
          menuClassName={menuClassName}
          rightSideContent={
            status === RequestStatus.success && userId ? (
              <User
                name={fullName}
                avatarSrc={
                  avatarUrl
                    ? (process.env.NEXT_PUBLIC_API_URL || "") + avatarUrl
                    : undefined
                }
              />
            ) : status === RequestStatus.pending ||
              router.pathname === "/auth" ? null : (
              <>
                <Button href="/auth" type="primary" label="Вход" />
                <Button
                  href="/auth?type=signUp"
                  type="secondary"
                  label="Регистрация"
                />
              </>
            )
          }
        />
        <main className={styles.root + " " + contentClassName}>{children}</main>
      </>
    );
  }
);

export default Layout;
