import { FC } from "react";
import { Cog, Vector } from "@/assets/index";

export const NavHeader: FC = () => {
  return (
    <div className="flex items-center gap-2 p-4 nav-header rounded-t-xl">
      <Vector />
      <div className="text-white">Orochi’s space</div>
      <Cog />
    </div>
  );
}