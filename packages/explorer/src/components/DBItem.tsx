"use client";
import { Button } from "./Button";
import { Icons } from "./Icons";
import { useState } from "react";

interface Props {
  dbName: string;
}

export const DBItem = ({ dbName }: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    {
      title: "characters",
    },
    {
      title: "class",
    },
    {
      title: "race",
    },
    {
      title: "weapons",
    },
    {
      title: "armors",
    },
  ];

  const toggle = () => {
    setIsOpen((old) => !old);
  };

  const transIcon = isOpen ? "rotate(90)" : "rotate(0)";
  const transClass = isOpen ? "flex" : "hidden";

  return (
    <>
      <div className="relative flex items-center gap-1 p-2" onClick={toggle}>
        <Icons.triangle
          className="w-4 h-5 pointer-events-none"
          transform={`${transIcon}`}
        />
        <Button className="w-11/12" btntype="nav">
          <Icons.DB className="w-5 h-5" />
          {dbName}
        </Button>
      </div>
      <div className={` flex flex-col ${transClass}`}>
        {menuItems.map((item, index) => (
          <Button
            className="w-11/12 py-2 pl-12 left-2"
            key={index}
            btntype="nav"
          >
            <Icons.Folder className="w-5 h-5" /> {item.title}
          </Button>
        ))}
      </div>
    </>
  );
};
