import { Icons } from "./Icons";
import { Button } from "./Button";

export const HomeMenu = (): JSX.Element => {
  return (
    <div className="relative flex flex-row items-start self-stretch w-full gap-4">
      <div className="relative flex items-center w-full gap-3 p-3 border-[1.5px] border-solid hover:bg-colors-dividers rounded-xl border-colors-dividers">
        <Icons.NewDatabase className="w-5 h-5" />
        <div className="relative flex flex-col items-start flex-1 grow">
          <div className="font-nunito self-stretch tracking-normal text-size14 text-[#192431] font-semibold leading-normal relative">
            New Database
          </div>
          <div className="relative self-stretch font-semibold leading-normal tracking-normal font-quicksand text-size10 text-colors-body-secondary">
            Create or import new data
          </div>
        </div>
      </div>
      <div className="relative flex items-center w-full gap-3 p-3 border-[1.5px] border-solid rounded-xl border-colors-dividers hover:bg-colors-dividers">
        <Icons.NewQuery className="w-5 h-5" />
        <div className="relative flex flex-col items-start flex-1 grow">
          <div className="font-nunito self-stretch tracking-normal text-size14 text-[#192431] font-semibold leading-normal relative">
            New Query
          </div>
          <div className="relative self-stretch font-semibold leading-normal tracking-normal font-quicksand text-size10 text-colors-body-secondary">
            Start saving your aggregations
          </div>
        </div>
      </div>
      <div className="relative flex items-center w-full gap-3 p-3 border-[1.5px] border-solid rounded-xl border-colors-dividers hover:bg-colors-dividers">
        <Icons.Template className="w-5 h-5" />
        <div className="relative flex flex-col items-start flex-1 grow">
          <div className="font-nunito self-stretch tracking-normal text-size14 text-[#192431] font-semibold leading-normal relative">
            Template
          </div>
          <div className="relative self-stretch font-semibold leading-normal tracking-normal font-quicksand text-size10 text-colors-body-secondary">
            Browse and pick a template
          </div>
        </div>
      </div>
    </div>
  );
};
