import { Icons } from "./Icons";

export const DatabaseInformation = (): JSX.Element => {
  return (
    <div className=" items-start self-stretch w-full shadow-[0px_0px_12px_1px_#1924310a] rounded-2xl bg-white">
      <div className="flex flex-col self-stretch gap-6 p-6">
        <div className="flex flex-row self-stretch">
          <div className=" font-nunito text-[#EC4525] tracking-[var(--section-title-letter-spacing)] text-[length:var(--section-title-font-size)] [font-style:var(--section-title-font-style)] flex-1 font-[number:var(--section-title-font-weight)] leading-[var(--section-title-line-height)]">
            admin
          </div>
          <Icons.dBIcon className="relative top-0 right-0 w-8 h-8" />
        </div>
        <div className="relative flex flex-row items-start gap-16">
          <div className="relative flex flex-col items-start flex-1 grow">
            <div className="font-quicksand self-stretch tracking-[var(--body-highlight-letter-spacing)] text-[length:var(--body-highlight-font-size)] [font-style:var(--body-highlight-font-style)] text-colors-body-primary font-[number:var(--body-highlight-font-weight)] leading-[var(--body-highlight-line-height)] relative">
              Storage size
            </div>
            <div className="font-quicksand self-stretch tracking-[var(--body-letter-spacing)] [font-style:var(--body-font-style)] text-[length:var(--body-font-size)] text-colors-body-primary font-[number:var(--body-font-weight)] leading-[var(--body-line-height)] relative">
              0 B
            </div>
          </div>
          <div className="relative flex flex-col items-start flex-1 grow">
            <div className="font-quicksand self-stretch  tracking-[var(--body-highlight-letter-spacing)] text-[length:var(--body-highlight-font-size)] [font-style:var(--body-highlight-font-style)] text-colors-body-primary font-[number:var(--body-highlight-font-weight)] leading-[var(--body-highlight-line-height)] relative">
              Collections
            </div>
            <div className="font-quicksand self-stretch tracking-[var(--body-letter-spacing)] [font-style:var(--body-font-style)] text-[length:var(--body-font-size)] text-colors-body-primary font-[number:var(--body-font-weight)] leading-[var(--body-line-height)] relative">
              0 B
            </div>
          </div>
          <div className="relative flex flex-col items-start flex-1 grow">
            <div className="font-quicksand self-stretch tracking-[var(--body-highlight-letter-spacing)] text-[length:var(--body-highlight-font-size)] [font-style:var(--body-highlight-font-style)] text-colors-body-primary font-[number:var(--body-highlight-font-weight)] leading-[var(--body-highlight-line-height)] relative">
              Indexes
            </div>
            <div className="font-quicksand self-stretch tracking-[var(--body-letter-spacing)] [font-style:var(--body-font-style)] text-[length:var(--body-font-size)] text-colors-body-primary font-[number:var(--body-font-weight)] leading-[var(--body-line-height)] relative">
              0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
