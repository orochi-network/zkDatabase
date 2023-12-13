import { FC } from "react";
import SvgHome from "@/assets/generated/Home";
import SvgQuery from "@/assets/generated/Query";
import { MenuItem } from "./MenuItem";

export const Menu: FC = () => {
  return (
    <div className="flex flex-col p-2">
      <MenuItem icon={<SvgHome />} title="Home" />
      <MenuItem icon={<SvgQuery />} title="My Queries" />
    </div>
  );
}