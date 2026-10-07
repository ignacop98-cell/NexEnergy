import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Easy Charge - Calculadora de Energía",
  description: "Calculadora de necesidades energéticas para generadores SECCO",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
