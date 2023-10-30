import { Icons } from "./Icons";

export const QueryDashboard = (): JSX.Element => {
  return (
    <div className="flex items-start self-stretch shadow-[0px_0px_12px_1px_#1924310a] relative w-full rounded-2xl bg-white">
      <div className="flex flex-col self-stretch w-full gap-6 p-6">
        <div className="relative flex flex-col items-start self-stretch gap-1">
          <div className="flex flex-row self-stretch justify-between">
            <div className="inline-flex items-center gap-2 px-2 py-1 h-6 rounded-[4px] relative !bg-colors-dividers ">
              <div className=" tracking-[var(--informative-caption-letter-spacing)] [font-style:var(--informative-caption-font-style)] text-[length:var(--informative-caption-font-size)] relative font-[number:var(--informative-caption-font-weight)] whitespace-nowrap leading-[var(--informative-caption-line-height)] !mt-[-5.00px] !text-colors-body-primary !mb-[-3.00px] !flex-1 ![font-family:'Nunito',Helvetica] ">
                .FIND
              </div>
            </div>
            <Icons.curlyIcon className="relative top-0 right-0 w-8 h-8" />
          </div>
          <div className="font-nunito text-[#EC4525] self-stretch tracking-[var(--section-title-letter-spacing)] [font-style:var(--section-title-font-style)] text-[length:var(--section-title-font-size)] flex-1 font-[number:var(--section-title-font-weight)] leading-[var(--section-title-line-height)] relative">
            Swords
          </div>
        </div>

        <div className="relative inline-flex flex-col items-start gap-4">
          <div className="relative inline-flex items-start gap-1">
            <Icons.DB className="relative w-5 h-5" color="#192431" />
            <div className="relative font-medium leading-normal tracking-normal font-nunito w-fit text-size14 text-colors-body-primary">
              sample_game
            </div>
          </div>
          <div className="relative inline-flex items-start gap-1">
            <Icons.Folder className="!relative w-5 h-5" />
            <div className="relative font-medium leading-normal tracking-normal font-nunito w-fit text-size14 text-colors-body-primary">
              weapons
            </div>
          </div>
        </div>
        <p className="relative font-semibold leading-normal tracking-normal font-quicksand w-fit text-size10 text-colors-body-secondary">
          Last modified 1 hour ago
        </p>
      </div>
    </div>
  );
};
