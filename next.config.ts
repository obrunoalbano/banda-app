import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
