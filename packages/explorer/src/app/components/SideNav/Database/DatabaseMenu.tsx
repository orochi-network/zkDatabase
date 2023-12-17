import SvgRightChevronIcon from "@/assets/generated/RightChevronIcon";
import { FC, ReactElement } from "react";
import { MenuItem } from "../Menu/MenuItem";

type DatabaseMenuProps = {
  id: string;
  icon: ReactElement;
  title: string;
}

export const DatabaseMenu: FC<DatabaseMenuProps> = ({ id, icon, title }) => {
  return (
    <div id={id} className="hs-collapse-toggle flex items-center gap-1 p-2 cursor-pointer" data-hs-collapse={`#${id}-heading`}>
      <SvgRightChevronIcon />
      <MenuItem icon={icon} title={title} />
    </div>
  );
}