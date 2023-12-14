import { FC } from "react";
import { Header } from "./Header";
import { SearchInput } from "@/components/shared/SearchInput";
import { DatabaseList } from "./DatabaseList";

export const Database: FC = () => {
  return (
    <div className="flex flex-col p-2">
      <Header />
      <SearchInput />
      <div className="mt-4">
        <DatabaseList />
      </div>
    </div>
  );
}