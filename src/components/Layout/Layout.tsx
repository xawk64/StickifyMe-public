import { Button, Link } from "@nextui-org/react";
import NavbarWrapper from "../ui/Navbar/Navbar";
import { useStore } from "../../store";
import { RequestStatus } from "../../store/enums";
import User from "../ui/User";

const menuItems = [
  { label: "Импорт", href: "/imports" },
  { label: "Настройки", href: "/settings" },
  { label: "Поддержка", href: "/support" },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    authStore: {
      status,
      state: { fullName, emailVerification, id: userId },
    },
  } = useStore();

  return (
    <>
      <NavbarWrapper
        menuItems={menuItems}
        rightSideContent={
          status === RequestStatus.success ? (
            <User name={fullName} />
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
};

export default Layout;
