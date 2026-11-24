"use client";

import { useEffect } from "react";

/** Registra o service worker do app instalável (public/sw.js). Sem suporte ou com erro: o app segue normal. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Ex.: modo privado ou navegador sem suporte — instalar o app só não fica disponível.
    });
  }, []);
  return null;
}
