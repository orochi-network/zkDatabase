import React from "react";
import { Icons } from "./Icons";
import { Button } from "./Button";

export const DashboardMenu = (): JSX.Element => {
  return (
    <div className="relative flex items-center self-stretch justify-between w-full">
      <div className="relative inline-flex items-center gap-2 ">
        <Button className="inline-flex !h-7" variant="primary">
          <Icons.Add color="#FCFEFF" className="w-4 h-4" />
          Create Database
        </Button>
        <Button
          variant="secondary"
          className="!border !border-colors-dividers inline-flex"
        >
          <Icons.Export className="w-4 h-4 " />
          Export Data
        </Button>
      </div>
      <div className="relative inline-flex items-center gap-6 ">
        <p className="relative font-bold leading-4 tracking-normal text-center w-fit font-nunito text-colors-body-primary text-size14 whitespace-nowrap">
          0 - 0 of 0
        </p>
        <Button btntype="nav">
          <Icons.Refresh className="w-5 h-5" />
        </Button>
        <div className="relative inline-flex items-center gap-2 ">
          <Button btntype="nav">
            <Icons.Arrow className="w-size14 h-size14" color="#ABAFC7" />
          </Button>
          <Button btntype="nav">
            <Icons.Arrow
              className="w-size14 h-size14"
              color="#ABAFC7"
              transform="rotate(180)"
            />
          </Button>
        </div>
        <div className="relative inline-flex items-center gap-2 ">
          <Button
            btntype="nav"
            className="relative w-fit !font-quicksand !font-bold text-colors-body-secondary whitespace-nowrap"
          >
            VIEW
          </Button>
          <div className="relative inline-flex items-center ">
            <Button btntype="nav" className="h-7">
              <Icons.Column className="w-5 h-5 mt-[-4.00px] mb-[-4.00px]" />
            </Button>
            <Button btntype="nav" className="h-[28px]">
              <Icons.Query className=" w-5 h-5 mt-[-4.00px] mb-[-4.00px]" />
            </Button>
            <Button btntype="nav" className="h-[28px]">
              <Icons.Grid className=" w-5 h-5 mt-[-4.00px] mb-[-4.00px]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
