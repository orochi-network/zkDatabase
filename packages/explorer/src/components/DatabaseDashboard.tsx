"use client";
import { Button } from "@/components/Button";
import { Filter } from "@/components/Filter";
import { DashboardMenu } from "@/components/DashboardMenu";
import { useState } from "react";
import clsx from "clsx";
import { DocumentView } from "./DocumentView";

export const DatabaseDashboard = (): JSX.Element => {
  type menu = "doc" | "agg" | "sch" | "ind" | "val";
  const [currentTab, setTab] = useState<menu>("doc");

  const checkTab = (tab: menu) => {
    if (currentTab == tab) {
      return "!border-b-colors-primary !border-b-2 !rounded-none !text-colors-body-primary !font-bold";
    } else {
      return null;
    }
  };

  const handleClick = (tab: menu) => {
    setTab(tab);
  };

  return (
    <>
      <div className="flex items-center gap-6 self-stretch w-full border-b [border-bottom-style:solid] border-colors-dividers">
        <Button
          className={clsx(
            "relative inline-flex flex-col items-start gap-1 font-quicksand text-colors-body-secondary whitespace-nowrap !text-base",
            checkTab("doc")
          )}
          btntype="nav"
          onClick={() => handleClick("doc")}
        >
          Documents
        </Button>
        <Button
          className={clsx(
            "relative inline-flex flex-col items-start gap-1 font-quicksand text-colors-body-secondary whitespace-nowrap !text-base",
            checkTab("agg")
          )}
          btntype="nav"
          onClick={() => handleClick("agg")}
        >
          Aggregations
        </Button>
        <Button
          className={clsx(
            "relative inline-flex flex-col items-start gap-1 font-quicksand text-colors-body-secondary whitespace-nowrap !text-base",
            checkTab("sch")
          )}
          btntype="nav"
          onClick={() => handleClick("sch")}
        >
          Schema
        </Button>

        <Button
          className={clsx(
            "relative inline-flex flex-col items-start gap-1 font-quicksand text-colors-body-secondary whitespace-nowrap !text-base",
            checkTab("ind")
          )}
          btntype="nav"
          onClick={() => handleClick("ind")}
        >
          Indexes
        </Button>
        <Button
          className={clsx(
            "relative inline-flex flex-col items-start gap-1 font-quicksand text-colors-body-secondary whitespace-nowrap !text-base",
            checkTab("val")
          )}
          btntype="nav"
          onClick={() => handleClick("val")}
        >
          Validation
        </Button>
      </div>
      <Filter />
      <DashboardMenu />

      {currentTab == "doc" && <DocumentView />}
    </>
  );
};
