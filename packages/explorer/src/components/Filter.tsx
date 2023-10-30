import React from "react";
import { Icons } from "./Icons";
import { Button } from "./Button";

export const Filter = (): JSX.Element => {
  return (
    <div className="self-stretch w-full flex-[0_0_auto]">
      <div
        className={`flex flex-row relative flex-[0_0_auto] gap-3 px-4 py-2 bg-colors-background rounded-[18px] border border-solid border-colors-dividers item-center`}
      >
        <div className="inline-flex h-8 items-center gap-1 relative flex-[0_0_auto] rounded-3xl">
          <div className="relative font-medium leading-normal tracking-normal w-fit font-nunito text-colors-primary text-size14">
            Filter
          </div>
        </div>
        <Button
          className="relative inline-flex items-center h-8 gap-1 rounded-3xl"
          btntype="nav"
        >
          <Icons.Clock className="w-5 h-5" />
          <Icons.triangle transform={"rotate(90)"} className=" !w-3 !h-4" />
        </Button>
        <label className="flex flex-1 grow items-center gap-2 p-2 left-0 bg-colors-foreground rounded-[10px] border-[1.5px] border-solid border-colors-dividers text-gray-400 focus-within:text-gray-600">
          <Icons.SearchBar className="relative w-4 h-4 transform pointer-events-none" />
          <input
            className="relative flex-1 mt-[-1.50px] font-sourcecode text-colors-body-secondary font-normal text-3 tracking-normal  leading-4 border-0 focus:outline-none appearance-none text-gray-500 "
            placeholder="type a query"
          />
        </label>

        <Button variant="secondary" className="!border border-colors-dividers">
          Explain
        </Button>
        <Button variant="secondary" className="!border border-colors-dividers">
          Reset
        </Button>
        <Button variant="primary">Find</Button>
        <Button variant="secondary" className="!border  border-colors-dividers">
          <Icons.Code />
        </Button>
        <Button variant="secondary" className="inline-flex h-8">
          <div className="relative font-medium leading-normal tracking-normal w-fit font-nunito text-colors-primary text-size14">
            Options
          </div>
          <Icons.triangle
            transform={"rotate(90)"}
            className=" !w-3 !h-4"
            color="#EC4525"
          />
        </Button>
      </div>
    </div>
  );
};
