import SvgRightChevronIcon from "@/assets/generated/RightChevronIcon";
import { FC, ReactElement } from "react";

type DatabaseMenuProps = {
  icon: ReactElement;
  title: string;
}

export const DatabaseMenu: FC<DatabaseMenuProps> = ({ icon, title }) => {
  return (
    <div className="flex items-center gap-1 p-2 cursor-pointer">
      <SvgRightChevronIcon className="mr-2"/>
      {icon}
      <div>{title}</div>
    </div>
  );
}