import { ButtonLink } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { LeadIcon, ShowIcon, VenueIcon, type Icon } from "@/components/ui/icons";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const FEATURES: { icon: Icon; title: string; description: string }[] = [
  {
    icon: VenueIcon,
    title: "Casas de show",
    description: "Contatos, cachê de referência e status do envio da sua proposta.",
  },
  {
    icon: ShowIcon,
    title: "Agenda de shows",
    description: "Datas, cachê de cada show e o que já foi pago.",
  },
  {
    icon: LeadIcon,
    title: "Contatos do site",
    description: "Pedidos de orçamento chegam direto do formulário do seu site.",
  },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/casas");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Brand />
        <ButtonLink href="/login" variant="ghost">
          Entrar
        </ButtonLink>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          A agenda da sua banda em um só lugar
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-fg-muted">
          Organize casas de show, shows com cachê e pagamento, e os contatos que chegam pelo seu site.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/cadastro" size="lg">
            Cadastrar minha banda
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="secondary">
            Já tenho conta
          </ButtonLink>
        </div>

        <ul className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
          {FEATURES.map(({ icon: FeatureIcon, title, description }) => (
            <li key={title} className="rounded-lg border border-line bg-surface p-5">
              <FeatureIcon className="size-6 text-fg-subtle" aria-hidden strokeWidth={1.5} />
              <h2 className="mt-3 text-base font-semibold text-fg">{title}</h2>
              <p className="mt-1 text-sm text-fg-muted">{description}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
