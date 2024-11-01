import {
  User as UserComponent,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import React from "react";
import { useRouter } from "next/router";
import { useStore } from "../../../store";
import styles from "./styles.module.scss";
import { observer } from "mobx-react-lite";

interface IUserProps {
  name: string;
  avatarSrc?: string;
  description?: string;
}

const User: React.FC<IUserProps> = observer(
  ({
    name,
    description,
    avatarSrc = process.env.NEXT_PUBLIC_API_URL +
      "/uploads/avatars/default_avatar.jpg",
  }) => {
    const router = useRouter();
    const { authStore } = useStore();

    const handleLogout = () => {
      localStorage.removeItem("accessToken");
      authStore.resetAuthState();

      router.push("/auth");
    };

    const items = [
      {
        key: "profile",
        label: (
          <div>
            Вы вошли как
            <span className="font-bold"> {name}</span>
          </div>
        ),
        className: "h-[72px]",
        showDivider: true,
        href: "/settings",
        color: "primary",
      },
      {
        key: "/imports",
        label: "Мои импорты",
        href: "/imports",
        showDivider: true,
        hidden: !authStore.state.wbApiKey || !authStore.state.emailVerification,
      },
      {
        key: "/history",
        label: "История импортов",
        href: "/history",
        showDivider: true,
        hidden: !authStore.state.wbApiKey || !authStore.state.emailVerification,
      },
      {
        key: "/warehouses-monitoring",
        label: "Мониторинг складов",
        href: "/telegram-bot",
        showDivider: true,
        hidden: !authStore.state.wbApiKey || !authStore.state.emailVerification,
      },
      {
        key: "/settings",
        label: "Настройки",
        href: "/settings",
        showDivider: true,
      },
      {
        key: "/support",
        label: "Помощь и обратная связь",
        href: "/support",
        showDivider: true,
      },
      {
        key: "logout",
        label: "Выйти из аккаунта",
        color: "danger",
        onClick: handleLogout,
      },
    ].filter((item) => !item.hidden);

    return (
      <Dropdown placement="bottom-start" trigger="press">
        <DropdownTrigger>
          <UserComponent
            as="button"
            name={name}
            description={description}
            avatarProps={{
              src: avatarSrc,
            }}
            className={styles.user}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="User Actions" color="secondary" items={items}>
          {(item) => (
            <DropdownItem
              key={item.key}
              color={
                item.color as
                  | "danger"
                  | "secondary"
                  | "default"
                  | "primary"
                  | "success"
                  | "warning"
                  | undefined
              }
              className={item.className}
              href={item.href}
              onClick={item.onClick}
            >
              {item.label}
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    );
  }
);

export default User;
