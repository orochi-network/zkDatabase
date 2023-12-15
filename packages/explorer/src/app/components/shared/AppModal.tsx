import { FC, ReactNode } from "react";

type AppModalProps = {
  children: ReactNode;
  id: string;
}

export const AppModal: FC<AppModalProps> = ({ children, id }) => {
  return (
    <div id={id} className="hs-overlay hidden w-full h-full fixed top-0 start-0 z-[60] overflow-x-hidden overflow-y-auto pointer-events-none">
      {children}
    </div>
  );
}