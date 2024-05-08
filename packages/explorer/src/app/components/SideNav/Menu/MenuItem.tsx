import { FC, ReactElement } from "react";

type MenuItemProps = {
  icon?: ReactElement;
  title: string;
}

export const MenuItem: FC<MenuItemProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center gap-1 p-2 text-sm cursor-pointer">
      {icon}
      <div>{title}</div>
    </div>
  );
}