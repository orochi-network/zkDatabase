import { FC } from "react";
import Link from 'next/link'

import SvgHome from "@/assets/generated/Home";
import SvgQuery from "@/assets/generated/Query";

import { MenuItem } from "./MenuItem";

export const Menu: FC = () => {
  return (
    <div className="flex flex-col p-2">
      <Link href='/'>
        <MenuItem icon={<SvgHome />} title="Home" />
      </Link>
      <Link href='/my-queries'>
        <MenuItem icon={<SvgQuery />} title="My Queries" />
      </Link>
    </div>
  );
}