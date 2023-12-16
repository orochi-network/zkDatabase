import SvgRightChevronIcon from "@/assets/generated/RightChevronIcon";
import { FC, ReactElement } from "react";
import { MenuItem } from "../Menu/MenuItem";

type DatabaseMenuProps = {
  icon: ReactElement;
  title: string;
}

export const DatabaseMenu: FC<DatabaseMenuProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center gap-1 p-2 cursor-pointer">
      <SvgRightChevronIcon />
      <MenuItem icon={icon} title={title} />
    </div>
  );
}