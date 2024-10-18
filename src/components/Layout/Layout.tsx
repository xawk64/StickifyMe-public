import { Button, Link } from "@nextui-org/react";
import NavbarWrapper from "../ui/Navbar/Navbar";
import { useStore } from "../../store";
import { RequestStatus } from "../../store/enums";
import User from "../ui/User";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import headerLogo from "../../assets/header_logo.png";

const menuItems = [
  { label: "Импорт", href: "/imports" },
  { label: "Настройки", href: "/settings" },
  { label: "Поддержка", href: "/support" },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = observer(({ children }) => {
  const {
    authStore: {
      status,
      state: { fullName, emailVerification, id: userId, avatarUrl },
    },
  } = useStore();
  console.log(process.env, "process.env.NEXT_PUBLIC_API_URL");

  return (
    <>
      <NavbarWrapper
        icon={<Image src={headerLogo} alt="logo" width={65} height={39} />}
        menuItems={menuItems}
        rightSideContent={
          status === RequestStatus.success ? (
            <User
              name={fullName}
              avatarSrc={(process.env.NEXT_PUBLIC_API_URL || "") + avatarUrl}
            />
          ) : status === RequestStatus.pending ? null : (
            <>
              <Link href="/auth" className="hidden lg:block">
                Вход
              </Link>
              <Button as={Link} color="primary" href="/auth" variant="flat">
                Регистрация
              </Button>
            </>
          )
        }
      />
      <main>{children}</main>
    </>
  );
});

export default Layout;
