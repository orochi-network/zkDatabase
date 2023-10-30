import { Nunito, Quicksand, Source_Code_Pro } from "next/font/google";
import "@/styles/globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});
const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-sourcecode",
});

export const metadata = {
  title: "zKDatabase Explorer",
  description: "Explorer for zkDatabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`bg-colors-background ${quicksand.variable} ${nunito.variable} ${sourceCode.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
