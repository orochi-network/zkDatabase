import { NewDatabase } from "@/components/NewDatabase";
import { InsertDocument } from "@/components/InsertDocument";
import { DatabaseInformation } from "@/components/DatabaseInformation";
import { QueryDashboard } from "@/components/QueryDashboard";
import { Header } from "@/components/Header";
import { HomeMenu } from "@/components/HomeMenu";

type Props = {
  searchParams: Record<string, string> | null | undefined;
};
export default function Page({ searchParams }: Props) {
  const showModal = searchParams?.newDatabaseModal;
  const showModal1 = searchParams?.insertDocument;
  return (
    <>
      <div className="flex flex-col items-start self-stretch w-full gap-6 mt-2">
        <Header />
        <HomeMenu />
        <DatabaseInformation />
        <QueryDashboard />
      </div>
      {showModal && <NewDatabase />}
      {showModal1 && <InsertDocument />}
    </>
  );
}
