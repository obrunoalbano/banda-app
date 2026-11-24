import { Analytics } from "@vercel/analytics/next";
import { PRODUCT_NAME } from "@/components/ui/Brand";
import { PwaRegister } from "@/components/PwaRegister";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { template: `%s · ${PRODUCT_NAME}`, default: PRODUCT_NAME },
  description: "Gerencie casas de show, agenda de shows e contatos da sua banda",
  applicationName: PRODUCT_NAME,
  // iPhone: "Adicionar à Tela de Início" abre em tela cheia, com este nome sob o ícone.
  appleWebApp: { capable: true, title: PRODUCT_NAME, statusBarStyle: "default" },
  // Telefones são links explícitos (wa.me/tel:); não deixar o Safari transformar números (cachês, datas).
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Conteúdo até as bordas (notch/barra de gestos); o respiro vem dos env(safe-area-inset-*) no CSS.
  viewportFit: "cover",
  // Teclado virtual encolhe a área visível (campos no fim do formulário não ficam escondidos).
  interactiveWidget: "resizes-content",
  // Cor da barra de status/título do app instalado = fundo da página (--canvas) em cada tema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
        <Analytics />
      </body>
    </html>
  );
}
