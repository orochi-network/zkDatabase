import { FC, ReactNode } from "react";

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  subTitle: string;
}

export const ActionCard: FC<ActionCardProps> = ({ icon, title, subTitle }) => {
  return (
    <div className="flex items-center flex-grow gap-3 p-3 border rounded-xl">
      {icon}
      <div className="flex flex-col">
        <div className="text-sm">{title}</div>
        <div className="text-xxs text- text-grey">{subTitle}</div>
      </div>
    </div>
  );
}