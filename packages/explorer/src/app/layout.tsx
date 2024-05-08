import { FC, ReactNode } from "react";
import '@/styles/globals.css'
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import PrelineScript from "@/components/PrelineScript"
import { SideNav } from "./components/SideNav";

type RootLayoutProps = {
  children: ReactNode;
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en" className="font-ninuto">
      <Header />
      <body>
        <div className="flex h-screen">
          <SideNav />
          {children}
        </div>
      </body>
      <Footer />
      <PrelineScript />
    </html>
  )
}
export default RootLayout;