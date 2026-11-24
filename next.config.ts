import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Service worker do PWA: sempre a versão mais nova (o navegador compara byte a byte).
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Integrações é dividida em abas (sub-rotas); a raiz abre a primeira aba.
      // Redirect HTTP (antes de renderizar): um redirect() dentro da página chega tarde
      // por causa do streaming do layout.
      { source: "/integracoes", destination: "/integracoes/agenda", permanent: false },
      // A senha passou a ser da conta (usuário), não da banda.
      { source: "/banda/senha", destination: "/conta/senha", permanent: true },
      // Painel superadmin: raiz e grupo de usuários abrem a primeira página.
      { source: "/admin", destination: "/admin/palcos", permanent: false },
      { source: "/admin/usuarios", destination: "/admin/usuarios/bandas", permanent: false },
    ];
  },
};

export default nextConfig;
