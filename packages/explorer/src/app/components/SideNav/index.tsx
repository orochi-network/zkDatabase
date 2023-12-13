import { FC } from "react";
import { NavHeader } from "./NavHeader";
import { Menu } from "./Menu";
import { Database } from "./Database";

export const SideNav: FC = () => {
  return (
    <div className="inline-flex flex-col border rounded-xl">
      <NavHeader />
      <Menu />
      <Database />
    </div>
  );
}