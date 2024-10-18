import { User as UserComponent } from "@nextui-org/react";
import React from "react";

interface IUserProps {
  name: string;
  avatarSrc?: string;
  description?: string;
}

const User: React.FC<IUserProps> = ({
  name,
  description,
  avatarSrc = "https://avatars.githubusercontent.com/u/30373425?v=4",
}) => {
  return (
    <UserComponent
      name={name}
      description={description}
      avatarProps={{
        src: avatarSrc,
      }}
    />
  );
};

export default User;
