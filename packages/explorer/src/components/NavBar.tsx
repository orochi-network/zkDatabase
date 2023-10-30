"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "./Button";
import { Icons } from "./Icons";
import { DBItem } from "./DBItem";

export const NavBar = (): JSX.Element => {
  const dbs = ["admin", "game", "users"];
  const pathname = usePathname();
  return (
    <div className="xl:w-[262px] md:w-[230px] sm:w-[200px] h-[804px] max-w-xs">
      <div className="flex flex-col relative  bg-colors-background rounded-[18px] overflow-hidden border border-solid border-colors-dividers shadow-[0px_0px_12px_1px_#1924310a] gap-2 items-center">
        <div className="self-stretch p-4 [background:linear-gradient(180deg,rgb(187,49,53)_0%,rgb(237,69,37)_38.54%,rgb(238,97,73)_100%)] flex items-center gap-[8px] top-0 left-0">
          <Icons.Logo className="relative w-[26.25px] h-5" />
          <div className="relative flex-1 mt-[-1.00px] font-nunito font-[number:var(--subtitle-font-weight)] text-colors-background text-[length:var(--subtitle-font-size)] tracking-[var(--subtitle-letter-spacing)] leading-[var(--subtitle-line-height)] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] [font-style:var(--subtitle-font-style)]">
            Orochi’s space
          </div>
          <Icons.Settings className="relative w-5 h-5" />
        </div>
        <Link href="/" className="w-11/12 px-4">
          <Button className="w-11/12 px-4" btntype="nav">
            <Icons.Home className="relative w-5 h-5" /> {"Home"}
          </Button>
        </Link>
        <Button className="w-11/12 px-4" btntype="nav">
          <Icons.Query className="w-5 h-5 " color="#192431" /> {"My Queries"}
        </Button>
        <div className="py-2 ">
          <div className="flex items-center h-10 gap-2 ">
            <div className="relative flex-1 font-bold leading-6 tracking-normal font-quicksand text-colors-body-secondary text-size14">
              DATABASES
            </div>
            <Link href={`${pathname}/?insertDocument=true`}>
              <Button className="!h-8 w-fit" btntype="nav">
                <Icons.Add className="relative w-5 h-5" color="#ABAFC7" />
              </Button>
            </Link>
          </div>
          <label className="flex items-center gap-2 p-2 left-0 bg-colors-background rounded-[10px] border-[1.5px] border-solid border-colors-dividers  text-gray-400 focus-within:text-gray-600">
            <Icons.SearchBar className="relative w-4 h-4 transform pointer-events-none" />
            <input
              className="relative mt-[-1.00px] font-quicksand font-semibold text-[12px] tracking-normal leading-normal border-0 focus:outline-none appearance-none text-gray-500 "
              placeholder="Search..."
            />
          </label>
        </div>

        <div className="h-[520px] overflow-x-hidden overflow-y-auto w-11/12">
          {dbs.map((db, index) => (
            <DBItem key={index} dbName={db} />
          ))}
        </div>
      </div>
    </div>
  );
};
