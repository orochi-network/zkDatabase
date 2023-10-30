import React, { forwardRef } from "react";
import clsx from "clsx";

type StatusVariant = "active" | "default";
type ButtonVariant = "primary" | "secondary" | "none";
type ButtonType = "btn" | "nav";

interface ButtonOptions {
  status?: StatusVariant;
  variant?: ButtonVariant;
  btntype?: ButtonType;
}

export type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  ButtonOptions;

type Ref = HTMLButtonElement;

const getStatus = (status: StatusVariant) => {
  switch (status) {
    case "active":
      return "bg-colors-dividers";
    case "default":
      return "bg-colors-background";
    default:
      return undefined;
  }
};

const getVariant = (variant: ButtonVariant) => {
  switch (variant) {
    case "primary":
      return "border-solid text-[#fcfeff] bg-colors-primary hover:bg-colors-primary-hover";
    case "secondary":
      return "border-solid bg-colors-background text-[#192431] hover:bg-colors-dividers";
    default:
      return undefined;
  }
};

const getBtnType = (btntype: ButtonType) => {
  switch (btntype) {
    case "btn":
      return "gap-2 px-4 h-8 justify-center w-fit font-bold text-center whitespace-nowrap leading-4";
    case "nav":
      return "gap-1 p-2 h-10 hover:bg-colors-dividers text-colors-body-primary font-medium leading-normal";
    default:
      return undefined;
  }
};

export const Button = forwardRef<Ref, ButtonProps>((props, ref) => {
  const {
    status = "default",
    type = "button",
    variant = "none",
    btntype = "btn",
    className,
    children,
    ...rest
  } = props;

  const merged = clsx(
    "btn inline-flex border-0 items-center rounded-lg relative font-nunito tracking-normal text-size14",
    getBtnType(btntype),
    getVariant(variant),
    getStatus(status),
    className
  );

  return (
    <button ref={ref} className={merged} {...rest}>
      {children}
    </button>
  );
});

Button.displayName = "Button";
