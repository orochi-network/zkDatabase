import { FC } from "react";
import { DatabaseMenu } from "./DatabaseMenu";
import SvgDatabaseIcon from "@/assets/generated/DatabaseIcon";
import SvgFolderIcon from "@/assets/generated/FolderIcon";
import { MenuItem } from "../Menu/MenuItem";

const databaseList = [
  {
    id: "admin-menu-collapse",
    icon: <SvgDatabaseIcon />,
    databaseName: "admin",
    tables: [
      {
        icon: <SvgFolderIcon />,
        tableName: 'characters',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'class',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'race',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'weapons',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'armors',
      },
    ]
  },
  {
    id: "game-menu-collapse",
    icon: <SvgDatabaseIcon />,
    databaseName: "game",
    tables: [
      {
        icon: <SvgFolderIcon />,
        tableName: 'characters',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'class',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'race',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'weapons',
      },
      {
        icon: <SvgFolderIcon />,
        tableName: 'armors',
      },
    ]
  },
]

export const DatabaseList: FC = () => {
  return (
    <div className="flex flex-col">
      {databaseList.map(({ id, icon, databaseName, tables }) => (
        <>
          <DatabaseMenu id={id} icon={icon} title={databaseName} />
          <div id={`${id}-heading`} className="hs-collapse hidden ml-8 overflow-hidden transition-[height] duration-300">
            {tables.map(({ icon, tableName }) => (
              <MenuItem key={tableName} icon={icon} title={tableName}/>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}