import { Alert } from "@/components/ui/Alert";
import { CodeBlock } from "@/components/ui/CodeBlock";

/** Mostra a senha provisória UMA vez (só o hash fica salvo). */
export function TempPasswordReveal({ email, password }: { email: string; password: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Alert tone="warning" title="Copie a senha provisória agora">
        Ela não será mostrada de novo. Envie ao usuário por um canal seguro — no primeiro acesso ele será obrigado a
        criar uma nova senha.
      </Alert>
      <CodeBlock label="Email de acesso" copyable>
        {email}
      </CodeBlock>
      <CodeBlock label="Senha provisória" copyable>
        {password}
      </CodeBlock>
    </div>
  );
}
