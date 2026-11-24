import { OfflineIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";
import { buttonClass } from "@/components/ui/styles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão" };

/**
 * PÚBLICO e estático — mostrada pelo service worker (public/sw.js) quando o app instalado abre
 * uma página sem internet. Não depende de sessão nem de banco.
 */
export default function OfflinePage() {
  return (
    <StatusPage
      icon={OfflineIcon}
      title="Sem conexão"
      description="Não foi possível carregar esta página. Confira sua internet e tente de novo."
      actions={
        // <a> (não <Link>): recarrega de verdade, passando de novo pelo service worker.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href="/casas" className={buttonClass("primary")}>
          Tentar de novo
        </a>
      }
    />
  );
}
