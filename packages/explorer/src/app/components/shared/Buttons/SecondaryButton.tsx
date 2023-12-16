import { FC, ReactNode } from "react";

type SecondaryButtonProps = {
  children: ReactNode;
  rest?: any;
}

export const SecondaryButton: FC<SecondaryButtonProps> = ({ children, ...rest }) => {
  return (
    <button type="button" className="inline-flex items-center px-4 py-2 text-sm font-semibold border gap-x-2 rounded-xl disabled:opacity-50 disabled:pointer-events-none" {...rest}>
      {children}
    </button>
  );
}