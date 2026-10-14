"use client";

import { PublicShowList } from "@/components/public/PublicShowList";
import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Brand } from "@/components/ui/Brand";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckboxField, CurrencyField, PhoneField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { AddIcon, EditIcon, EmailIcon, ShowIcon, WhatsappIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { containerClass, type ButtonVariant } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatCents } from "@/lib/money";
import { useState } from "react";

const TOKENS = [
  ["canvas", "Fundo da página"],
  ["surface", "Cards, tabelas, inputs"],
  ["surface-muted", "Menu, cabeçalho de tabela, filtros"],
  ["surface-sunken", "Hover, código, skeleton"],
  ["line", "Bordas e divisórias"],
  ["line-strong", "Borda de input"],
  ["fg", "Texto principal"],
  ["fg-muted", "Texto secundário"],
  ["fg-subtle", "Labels, metadados"],
  ["primary", "Ação principal"],
  ["danger", "Ação destrutiva"],
  ["focus", "Anel de foco"],
] as const;

const TONES = ["neutral", "info", "success", "warning", "danger"] as const;
const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger", "danger-solid"];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-line py-10">
      <h2 className="mb-6 text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [cents, setCents] = useState<number | null>(150000);
  const [phone, setPhone] = useState("(11) 99999-0000");

  return (
    <div className={containerClass}>
      <PageHeader
        title="Design system"
        description="Referência viva dos tokens e componentes. Documentação: docs/design-system.md"
      >
        <Brand />
      </PageHeader>

      <Section id="cores" title="Cores (tokens semânticos)">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TOKENS.map(([name, use]) => (
            <li key={name} className="overflow-hidden rounded-lg border border-line">
              <div className="h-12" style={{ background: `var(--${name})` }} />
              <div className="p-2">
                <p className="font-mono text-xs text-fg">{name}</p>
                <p className="text-xs text-fg-subtle">{use}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tipografia" title="Tipografia">
        <div className="space-y-3">
          <p className="text-2xl font-semibold tracking-tight text-fg">Título de página — text-2xl semibold</p>
          <p className="text-lg font-semibold text-fg">Título de seção — text-lg semibold</p>
          <p className="text-base font-semibold text-fg">Título de card — text-base semibold</p>
          <p className="text-sm text-fg">Corpo — text-sm (padrão da interface)</p>
          <p className="text-sm text-fg-muted">Texto secundário — text-sm text-fg-muted</p>
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Label de detalhe — text-xs uppercase</p>
          <p className="tabular font-mono text-sm text-fg">R$ 1.500,00 · 15/12/2026 · 21:00 (tabular)</p>
        </div>
      </Section>

      <Section id="botoes" title="Botões">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Pequeno (sm)</Button>
            <Button>Médio (md)</Button>
            <Button size="lg">Grande (lg)</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="#botoes" icon={AddIcon}>
              Com ícone
            </ButtonLink>
            <Button loading>Salvando…</Button>
            <Button disabled>Desabilitado</Button>
            <ConfirmButton
              label="Abrir confirmação"
              title="Remover?"
              description="Remover o item de exemplo? Esta ação não pode ser desfeita."
              confirmLabel="Remover"
              tone="danger"
              variant="danger"
              onConfirm={async () => null}
            />
          </div>
        </div>
      </Section>

      <Section id="feedback" title="Badges e alertas">
        <div className="mb-6 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Badge key={t} tone={t}>
              {t}
            </Badge>
          ))}
          <StatusBadge status="NAO_ENVIADO" />
          <StatusBadge status="ENVIADO" />
          <StatusBadge status="FINALIZADO" />
          <ShowPaymentBadge status="PAGO" />
          <ShowPaymentBadge status="AGUARDANDO_PAGAMENTO" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert>Erro: email ou senha incorretos.</Alert>
          <Alert tone="success">Dados atualizados.</Alert>
          <Alert tone="warning" title="Copie o token agora">
            Ele não será mostrado de novo.
          </Alert>
          <Alert tone="info">Informação neutra para o usuário.</Alert>
        </div>
      </Section>

      <Section id="formularios" title="Formulário">
        <Card title="Card com formulário" description="Campos com label ligado, obrigatórios com *.">
          <form className="grid max-w-xl gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
            <TextField label="Nome da casa" className="sm:col-span-2" required defaultValue="Bar do Zé" />
            <PhoneField label="Telefone" value={phone} onValueChange={setPhone} />
            <SelectField label="Status de envio" defaultValue="ENVIADO">
              <option value="NAO_ENVIADO">Não enviado</option>
              <option value="ENVIADO">Enviado</option>
            </SelectField>
            <CurrencyField
              label="Cachê"
              className="sm:col-span-2"
              value={cents}
              onValueChange={setCents}
              hint="Digite só números: 150000 → 1.500,00"
            />
            <TextAreaField label="Observações" className="sm:col-span-2" rows={2} />
            <CheckboxField
              label="Mostrar na agenda pública"
              className="sm:col-span-2"
              defaultChecked
              hint="Checkbox com dica: opções liga/desliga dentro de formulários."
            />
          </form>
        </Card>
      </Section>

      <Section id="detalhe" title="Lista de detalhes">
        <DetailList>
          <DetailItem label="Email" wide>
            <ExternalLink href="mailto:contato@exemplo.com" icon={EmailIcon}>
              contato@exemplo.com
            </ExternalLink>
          </DetailItem>
          <DetailItem label="WhatsApp">
            <ExternalLink href="https://wa.me/5511999990000" icon={WhatsappIcon}>
              (11) 99999-0000
            </ExternalLink>
          </DetailItem>
          <DetailItem label="Cachê" numeric>
            {formatCents(150000)}
          </DetailItem>
          <DetailItem label="Instagram">{null}</DetailItem>
        </DetailList>
      </Section>

      <Section id="tabela" title="Tabela (vira cards no mobile)">
        <Table
          caption="Exemplo"
          headers={[{ label: "Casa" }, { label: "Cachê" }, { label: "Pagamento" }, { label: "Ações", align: "right" }]}
        >
          {[
            ["Bar do Zé", 150000, "PAGO"],
            ["Evento Particular", null, "AGUARDANDO_PAGAMENTO"],
          ].map(([name, value, status]) => (
            <Tr key={String(name)}>
              <Td label="Casa" strong>
                {name}
              </Td>
              <Td label="Cachê" numeric>
                {formatCents(value as number | null)}
              </Td>
              <Td label="Pagamento">
                <ShowPaymentBadge status={status as "PAGO" | "AGUARDANDO_PAGAMENTO"} />
              </Td>
              <Td label="Ações" align="right">
                <ButtonLink href="#tabela" variant="ghost" size="sm" icon={EditIcon}>
                  Detalhes
                </ButtonLink>
              </Td>
            </Tr>
          ))}
        </Table>
        <Pagination page={2} total={130} basePath="/design-system" />
      </Section>

      <Section id="agenda-publica" title="Agenda pública (página /b/[slug] e widget)">
        <PublicShowList
          shows={[
            {
              id: "1",
              date: "2026-12-15",
              time: "21:00",
              status: "scheduled",
              title: "Bar do Zé",
              venue: { name: "Bar do Zé", city: "Santos", state: "SP" },
              city: "Santos",
              state: "SP",
              ticketUrl: "https://exemplo.com/ingressos",
            },
            {
              id: "2",
              date: "2026-12-20",
              time: "20:00",
              status: "cancelled",
              title: "Evento particular",
              venue: null,
              city: "Campinas",
              state: "SP",
              ticketUrl: null,
            },
          ]}
        />
      </Section>

      <Section id="vazio" title="Estado vazio e código">
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            icon={ShowIcon}
            title="Nenhum show cadastrado"
            description="Registre seus shows para controlar cachê e pagamento."
            action={{ href: "#vazio", label: "Cadastrar o primeiro show", primary: true }}
          />
          <CodeBlock label="Endpoint" copyable>
            https://exemplo.com/api/leads/ingest
          </CodeBlock>
        </div>
      </Section>
    </div>
  );
}
