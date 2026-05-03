import { VenueForm } from "@/components/VenueForm";
import Link from "next/link";

export default function NovaCasaPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/casas"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Voltar à listagem
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Nova casa de show
        </h1>
      </div>
      <VenueForm mode="create" />
    </div>
  );
}
