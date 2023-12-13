import { FC, ReactNode } from "react";
import '@/styles/globals.css'
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import PrelineScript from "@/components/PrelineScript"

type RootLayoutProps = {
  children: ReactNode;
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <Header />
      <body>{children}</body>
      <Footer />
      <PrelineScript />
    </html>
  )
}
export default RootLayout;