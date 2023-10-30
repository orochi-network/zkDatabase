import { NewDatabase } from "@/components/NewDatabase";
import { InsertDocument } from "@/components/InsertDocument";
import { DatabaseDashboard } from "@/components/DatabaseDashboard";
import { Sorter } from "@/components/Sorter";

type Props = {
  searchParams: Record<string, string> | null | undefined;
};

export default function Page({ searchParams }: Props) {
  const showModal = searchParams?.newDatabaseModal;
  const showModal1 = searchParams?.insertDocument;
  return (
    <>
      <div className="flex flex-col items-start self-stretch w-full gap-6 mt-2">
        <div className="relative flex items-start self-stretch w-full gap-6 ">
          <div className="relative flex-1">
            <span className="text-[#ec4525] font-nunito [font-style:var(--title-font-style)] font-[number:var(--title-font-weight)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] text-[length:var(--title-font-size)]">
              game
            </span>
            <span className="text-[#192431] font-nunito [font-style:var(--title-font-style)] font-[number:var(--title-font-weight)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] text-[length:var(--title-font-size)]">
              .characters
            </span>
          </div>
          <Sorter />
        </div>
        <DatabaseDashboard />
      </div>
      {showModal && <NewDatabase />}
      {showModal1 && <InsertDocument />}
    </>
  );
}
