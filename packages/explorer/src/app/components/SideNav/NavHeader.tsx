import { Cog, Vector } from "@/assets/index";

export default function NavHeader() {
  return (
    <div className="flex items-center gap-2 p-4 nav-header rounded-t-xl">
      <Vector />
      <div className="text-white">Orochi’s space</div>
      <Cog />
    </div>
  );
}