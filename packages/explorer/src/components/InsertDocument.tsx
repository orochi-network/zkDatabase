"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Editor } from "./Editor";
import { Button } from "./Button";
import { Icons } from "./Icons";

export const InsertDocument = (): JSX.Element => {
  const pathname = usePathname();
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
          <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
            <div className="flex w-[670px] items-start gap-[24px] relative flex-[0_0_auto]">
              <div className="font-nunito relative flex-1 mt-[-1.00px] font-[number:var(--title-font-weight)] text-colors-body-primary text-[length:var(--title-font-size)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]">
                Insert Document
              </div>
              <Link href={pathname}>
                <Button btntype="nav">
                  <Icons.Close className="!relative !w-[20px] !h-[20px]" />
                </Button>
              </Link>
            </div>
            <div className="relative w-fit font-quicksand font-[number:var(--body-font-weight)] text-colors-body-primary text-[length:var(--body-font-size)] tracking-[var(--body-letter-spacing)] leading-[var(--body-line-height)] whitespace-nowrap [font-style:var(--body-font-style)]">
              To collection game.characters
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 self-stretch w-full relative flex-[0_0_auto]">
            <div className="relative w-fit [font-family:'Quicksand',Helvetica] font-bold text-colors-body-secondary text-[14px] tracking-[0] leading-[24px] whitespace-nowrap">
              VIEW
            </div>
            <div className="inline-flex items-start relative flex-[0_0_auto]">
              <Button btntype="nav">
                <Icons.Curly className="!relative !w-[20px] !h-[20px]" />
              </Button>
              <Button className="!flex-[0_0_auto]" btntype="nav">
                <Icons.Lines className="!relative !w-[20px] !h-[20px]" />
              </Button>
            </div>
            <div className="relative w-px h-[16px] bg-colors-body-secondary rounded-md" />
            <Button className="!flex-[0_0_auto]" btntype="nav">
              <Icons.Copy className="!relative !w-[20px] !h-[20px]" />
            </Button>
            <Button className="!flex-[0_0_auto]" btntype="nav">
              <Icons.Auto className="!relative !w-[20px] !h-[20px]" />
            </Button>
          </div>
          <div className="flex flex-col items-start self-stretch w-full bg-colors-background relative flex-[0_0_auto]">
            <Editor className="h-[190px] self-stretch" />
          </div>
          <div className="flex items-center justify-end gap-[16px] self-stretch w-full relative flex-[0_0_auto]">
            <Link href={pathname}>
              <Button variant="secondary" className="!border">
                Cancel
              </Button>
            </Link>
            <Button variant="primary">Insert</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
