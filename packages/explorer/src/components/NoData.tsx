"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "./Button";
import { Icons } from "./Icons";

export const NoData = (): JSX.Element => {
  const pathname = usePathname();
  return (
    <div className="inline-flex flex-col items-center gap-[24px] self-stretch w-full pt-[80px]">
      <Icons.Document className="w-[64px] h-[64px]" color="#BF2F02" />
      <div className="inline-flex flex-col items-center gap-[5px]">
        <span className="relative w-fit mt-[-1.00px] font-quicksand font-[number:var(--body-highlight-font-weight)] text-colors-body-primary text-[length:var(--body-highlight-font-size)] text-center tracking-[var(--body-highlight-letter-spacing)] leading-[var(--body-highlight-line-height)] whitespace-nowrap [font-style:var(--body-highlight-font-style)]">
          This collection has no data
        </span>
        <span className="relative w-fit font-nunito font-medium text-[#192431] text-[14px] text-center tracking-[0] leading-[normal]">
          Import data from a JSON or CSV file in a few seconds
        </span>
      </div>
      <Link href={`${pathname}/?insertDocument=true`}>
        <Button variant="primary">Import Data</Button>
      </Link>
    </div>
  );
};
