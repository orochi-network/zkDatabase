import { Icons } from "./Icons";
import { Button } from "./Button";
import { Sorter } from "./Sorter";

export const Header = (): JSX.Element => {
  return (
    <div className="relative flex items-start self-stretch w-full gap-6 ">
      <div className=" flex-1 font-nunito font-[number:var(--title-font-weight)] text-colors-body-primary text-[length:var(--title-font-size)] tracking-[var(--title-letter-spacing)] leading-[var(--title-line-height)] [font-style:var(--title-font-style)]">
        Orochi’s space
      </div>
      <Sorter />
    </div>
  );
};
