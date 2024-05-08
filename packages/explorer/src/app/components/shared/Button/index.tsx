import { ButtonVariant } from "@/types/index";
import { FC, ReactNode } from "react";

type ButtonProps = {
  variant: ButtonVariant;
  children: ReactNode;
  rest?: any;
}

const BUTTON_VARIANTS = {
  primary: 'text-white bg-primary hover:bg-primaryHover',
  secondary: 'border',
}

export const Button: FC<ButtonProps> = ({ variant, children, ...rest }) => {
  return (
    <button type="button" className={BUTTON_VARIANTS[variant]} {...rest}>
      {children}
    </button>
  );
}