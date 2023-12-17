"use client"
import { FC, ReactNode } from "react";
import { useParams } from "next/navigation";
import { DisplayingStyleButtons } from "@/components/shared/DisplayingStyleButtons";

type RootLayoutProps = {
  children: ReactNode;
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
  const params = useParams();
  return (
    <section className="flex-grow page-wrapper">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">{`${params.slug[0]}.${params.slug[1]}`}</div>
        <DisplayingStyleButtons />
      </div>
      {children}
    </section>
  )
}
export default RootLayout;