"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "./Button";
import { Icons } from "./Icons";

export const NewDatabase = (): JSX.Element => {
  const pathname = usePathname();
  console.log(pathname);
  return (
    <div
      className="fixed inset-0 z-10 flex justify-center overflow-y-auto"
      id="modal"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-baseline justify-center px-4 pt-4 pb-20">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-[50vh]"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-flex flex-col items-start gap-8 p-8 relative bg-colors-foreground rounded-[18px] overflow-hidden border border-solid border-colors-dividers">
          <div className="w-[670px] items-start gap-6 flex relative flex-[0_0_auto]">
            <div className="font-nunito relative flex-1 mt-[-1.00px] font-[number:var(--title-font-weight)] text-colors-body-primary text-[length:var(--title-font-size)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]">
              New Database
            </div>
            <Link href={pathname}>
              <Button className="!flex-[0_0_auto]" btntype="nav">
                <Icons.Close className="!relative !w-5 !h-5" />
              </Button>
            </Link>
          </div>
          <div className="flex-col items-start self-stretch w-full flex relative flex-[0_0_auto]">
            <div className="font-nunito relative self-stretch mt-[-1.00px] font-bold text-colors-body-primary text-size14 tracking-normal leading-normal">
              Database name
            </div>
            <input
              className="flex h-10 items-center gap-2 p-2 relative self-stretch w-full bg-colors-background rounded-[10px] border-[1.5px] border-solid border-colors-dividers"
              placeholder="database name"
            />
          </div>
          <div className="flex-col items-start self-stretch w-full flex relative flex-[0_0_auto]">
            <div className="font-nunito relative self-stretch mt-[-1.00px] font-bold text-colors-body-primary text-size14 tracking-normal leading-normal">
              Collection name
            </div>
            <input
              className="flex h-10 items-center gap-2 p-2 relative self-stretch w-full bg-colors-background rounded-[10px] border-[1.5px] border-solid border-colors-dividers"
              placeholder="collection name"
            />
          </div>
          <div className="items-center justify-end gap-4 self-stretch w-full flex relative flex-[0_0_auto]">
            <Link href={pathname}>
              <Button className="!flex-[0_0_auto] !border" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button className="!flex-[0_0_auto]" variant="primary">
              Create Database
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
