import { FC, ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
}

export const PrimaryButton: FC<PrimaryButtonProps> = ({ children }) => {
  return (
    <button type="button" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl gap-x-2 hover:bg-primaryHover disabled:opacity-50 disabled:pointer-events-none">
      {children}
    </button>
  );
}