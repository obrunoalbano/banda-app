"use client";

import { useEffect } from "react";

/** Mensagem que o widget envia ao site hospedeiro (lida por public/embed.js). */
export const EMBED_RESIZE_MESSAGE = "agenda-banda:resize";

/**
 * Informa a altura do conteúdo ao site que embutiu o iframe (auto-ajuste de altura).
 * Mede o elemento [data-embed], não o documento: dentro de um iframe o `scrollHeight`
 * do documento nunca é menor que a altura do próprio iframe (só cresceria, nunca encolheria).
 */
export function EmbedAutoResize() {
  useEffect(() => {
    if (window.parent === window) return;
    const content = document.querySelector<HTMLElement>("[data-embed]");
    if (!content) return;
    let last = 0;
    const send = () => {
      const height = Math.ceil(content.getBoundingClientRect().bottom + window.scrollY);
      if (height === last) return;
      last = height;
      window.parent.postMessage({ type: EMBED_RESIZE_MESSAGE, height }, "*");
    };
    const observer = new ResizeObserver(send);
    observer.observe(content);
    send();
    return () => observer.disconnect();
  }, []);
  return null;
}
