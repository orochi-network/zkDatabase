import { FC } from "react";
import { DatabaseMenu } from "./DatabaseMenu";
import SvgDatabaseIcon from "@/assets/generated/DatabaseIcon";

export const DatabaseList: FC = () => {
  return (
    <div className="flex flex-col">
      <DatabaseMenu icon={<SvgDatabaseIcon />} title="admin" />
      <DatabaseMenu icon={<SvgDatabaseIcon />} title="game" />
    </div>
  );
}