import { NavBar } from "@/components/NavBar";
import clsx from "clsx";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex self-stretch justify-center mt-8">
      <div className="flex flex-row justify-center w-screen gap-0 center-center ">
        <NavBar />
        <div
          className={clsx(
            "p-6 bg-bottom bg-no-repeat max-w-screen-xl self-stretch flex-1"
          )}
          style={{
            backgroundImage: `url('/assets/images/vector-1.svg')`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
