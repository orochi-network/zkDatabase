import { FC } from "react";
import SvgNewDatabase from "@/assets/generated/NewDatabase";
import SvgNewQuery from "@/assets/generated/NewQuery";
import SvgNewTemplate from "@/assets/generated/NewTemplate";
import { ActionCard } from "@/components/shared/ActionCard";

const Page: FC = () => {
  return (
    <div className="page-wrapper">
      <div className="text-3xl font-bold">Orochi’s space</div>
      <div className="flex gap-4 py-6">
        <ActionCard icon={<SvgNewDatabase />} title="New Database" subTitle="Create or import new database" />
        <ActionCard icon={<SvgNewQuery />} title="New Query" subTitle="Start saving your aggregations" />
        <ActionCard icon={<SvgNewTemplate />} title="New Template" subTitle="Browse and pick a template" />
      </div>
    </div>
  )
}

export default Page;