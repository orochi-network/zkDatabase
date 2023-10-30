import { Button } from "./Button";
import { Editor } from "./Editor";

export const DocumentData = (): JSX.Element => {
  return (
    <div className="flex flex-col self-stretch w-full rounded-lg">
      <div className="flex py-[6px] border border-b-0 border-solid border-colors-dividers rounded-tl-2xl rounded-tr-2xl" />
      <Editor className="self-stretch w-full !border-r rounded-tr-2xl rounded-tl-2xl" />
      <div className="flex items-center gap-2 px-6 py-2 bg-[#ec45251a] rounded-br-2xl rounded-bl-2xl">
        <div className="relative flex-1 font-medium leading-normal tracking-normal font-nunito text-colors-primary-hover text-size14">
          Document modified
        </div>
        <Button
          btntype="nav"
          className="h-7 px-2 py-0 bg-colors-foreground rounded-lg border border-solid border-[#ec452533] inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] all-[unset] box-border"
        >
          <div className="text-colors-primary relative w-fit font-nunito font-bold text-size14 text-center tracking-normal leading-[16px] whitespace-nowrap">
            Cancel
          </div>
        </Button>
        <Button
          btntype="nav"
          className="h-7 px-2 py-0 bg-colors-foreground rounded-lg border border-solid border-[#ec452533] inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]"
        >
          <div className="relative w-fit font-nunito font-bold text-colors-primary text-size14 text-center tracking-normal leading-[16px] whitespace-nowrap">
            Replace
          </div>
        </Button>
      </div>
    </div>
  );
};
