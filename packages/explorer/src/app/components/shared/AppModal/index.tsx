import SvgCloseIcon from "@/assets/generated/CloseIcon";
import { FC, ReactNode } from "react";

type AppModalProps = {
  id: string;
  title: string;
  children: ReactNode;
}

export const AppModal: FC<AppModalProps> = ({ id, title, children }) => {
  return (
    <div id={id} className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 hidden w-full h-full fixed top-0 start-0 z-[60] opacity-0 overflow-x-hidden transition-all overflow-y-auto pointer-events-none">
      <div className="m-0 transition-all opacity-0 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 sm:max-w-lg sm:w-full sm:mx-auto min-h-[calc(100%-3.5rem)] flex items-center">
        <div className="flex flex-col w-full p-8 bg-white border shadow-sm pointer-events-auto rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold">
              {title}
            </h3>
            <button type="button" className="flex items-center justify-center cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none" data-hs-overlay={`#${id}`}>
              <SvgCloseIcon />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}