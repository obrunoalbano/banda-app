import { RegisterForm } from "@/components/RegisterForm";
import Link from "next/link";

export default function CadastroPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 w-full max-w-md text-center">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← Início
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Cadastro da banda
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Preencha os dados da banda. O email e a senha serão usados no login.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
