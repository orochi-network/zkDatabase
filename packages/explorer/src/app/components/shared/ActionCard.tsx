import { FC, ReactNode } from "react";

type ActionCardProps = {
  modalId: string;
  icon: ReactNode;
  title: string;
  subTitle: string;
  handleClick: (modalId: string) => void;
}

export const ActionCard: FC<ActionCardProps> = ({ modalId, icon, title, subTitle, handleClick }) => {

  const onClick = () => {
    handleClick(modalId);
  }

  return (
    <div className="flex items-center flex-grow gap-3 p-3 card" onClick={onClick} data-hs-overlay={`#${modalId}`}>
      {icon}
      <div className="flex flex-col">
        <div className="text-sm">{title}</div>
        <div className="text-xxs text- text-grey">{subTitle}</div>
      </div>
    </div>
  );
}