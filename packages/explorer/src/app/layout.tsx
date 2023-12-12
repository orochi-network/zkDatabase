import Footer from "@/components/Footer"
import Header from "@/components/Header"
import PrelineScript from "@/components/PrelineScript"
import '@/styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Header />
      <body>{children}</body>
      <Footer />
      <PrelineScript />
    </html>
  )
}