import SvgHamburgerIcon from "@/assets/generated/HamburgerIcon";
import SvgIconsIcon from "@/assets/generated/IconsIcon";
import SvgSortAscIcon from "@/assets/generated/SortAscIcon";
import { FC } from "react";

export const DisplayingStyleButtons: FC = () => {
  return (
    <div className="flex">
      <div className="p-2 cursor-pointer">
        <SvgHamburgerIcon />
      </div>
      <div className="p-2 cursor-pointer">
        <SvgIconsIcon />
      </div>
      <div className="p-2">
        |
      </div>
      <div className="p-2 cursor-pointer">
        <div className="flex gap-1">
          <SvgSortAscIcon />
          <div>Most recent</div>
        </div>
      </div>
    </div>
  );
}