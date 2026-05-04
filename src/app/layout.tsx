import "./globals.css";

export const metadata = {
  title: "Estoque TI",
  description: "Sistema de gestao de estoque de TI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
