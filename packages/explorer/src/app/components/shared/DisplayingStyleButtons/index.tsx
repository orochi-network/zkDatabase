import SvgHamburgerIcon from "@/assets/generated/HamburgerIcon";
import SvgIconsIcon from "@/assets/generated/IconsIcon";
import SvgSortAscIcon from "@/assets/generated/SortAscIcon";
import { FC } from "react";

export const DisplayingStyleButtons: FC = () => {
  return (
    <div className="flex items-center">
      <div className="p-2 cursor-pointer">
        <SvgHamburgerIcon />
      </div>
      <div className="p-2 cursor-pointer">
        <SvgIconsIcon />
      </div>
      <div className="h-4 vertical-divider" />
      <div className="flex items-center gap-1 p-2 cursor-pointer">
        <SvgSortAscIcon />
        <div>Most recent</div>
      </div>
    </div>
  );
}