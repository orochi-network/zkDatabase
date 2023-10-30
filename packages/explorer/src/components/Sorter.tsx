import { Icons } from "./Icons";
import { Button } from "./Button";

export const Sorter = (): JSX.Element => {
  return (
    <div className="inline-flex items-center gap-2 ">
      <div className="inline-flex items-start ">
        <Button btntype="nav">
          <Icons.Column className="w-5 h-5" />
        </Button>
        <Button btntype="nav">
          <Icons.Grid className="w-5 h-5" />
        </Button>
      </div>
      <div className="w-px h-4 rounded-lg bg-colors-body-secondary" />
      <Button btntype="nav">
        <Icons.Recent className="w-5 h-5 " /> {"Most recent"}
      </Button>
    </div>
  );
};
