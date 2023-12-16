import SvgMagnifyingGlassIcon from "@/assets/generated/MagnifyingGlassIcon";
import { FC } from "react";

export const SearchInput: FC = () => {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-xl">
      <SvgMagnifyingGlassIcon />
      <input className="focus:outline-none" placeholder={'Search...'}></input>
    </div>
  );
}