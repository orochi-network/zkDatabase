import SvgAddIcon from "@/assets/generated/AddIcon";
import { FC } from "react";

export const Header: FC = () => {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="font-bold text-grey">DATABASES</div>
      <SvgAddIcon />
    </div>
  );
}