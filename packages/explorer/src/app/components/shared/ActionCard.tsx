import { FC, ReactNode } from "react";

type ActionCardProps = {
  modalId: string;
  icon: ReactNode;
  title: string;
  subTitle: string;
}

export const ActionCard: FC<ActionCardProps> = ({ modalId, icon, title, subTitle }) => {

  return (
    <div className="flex items-center flex-grow gap-3 p-3 cursor-pointer card" data-hs-overlay={`#${modalId}`}>
      {icon}
      <div className="flex flex-col">
        <div className="text-sm">{title}</div>
        <div className="text-xxs text-grey">{subTitle}</div>
      </div>
    </div>
  );
}