"use client";

import { useId } from "react";
import { centsFromDigits, formatCentsPlain } from "@/lib/money";
import { maskPhoneBr } from "@/lib/format";
import { hintClass, inputClass, labelClass } from "./styles";

/*
 * Campos de formulário com <label htmlFor> ligado ao controle (acessibilidade).
 * `className` vai no wrapper (ex.: "sm:col-span-2"); o resto das props vai no controle.
 */

type WrapperProps = { label: string; hint?: React.ReactNode; className?: string };

/** Campos obrigatórios recebem " *" no label (o `required` nativo cuida da validação). */
function FieldWrapper({
  id,
  label,
  hint,
  className,
  required,
  children,
}: WrapperProps & { id: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? (
          <span className="text-fg-subtle" aria-hidden>
            {" "}*
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

export function TextField({ label, hint, className, ...props }: WrapperProps & InputProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} className={className} required={props.required}>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      />
    </FieldWrapper>
  );
}

/** Telefone com máscara BR — (11) 99999-0000. Aceita "+DDI..." sem máscara. */
export function PhoneField({
  value,
  onValueChange,
  ...props
}: WrapperProps &
  Omit<InputProps, "value" | "onChange" | "type"> & {
    value: string;
    onValueChange: (value: string) => void;
  }) {
  return (
    <TextField
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(11) 99999-0000"
      value={value}
      onChange={(e) => onValueChange(maskPhoneBr(e.target.value))}
      {...props}
    />
  );
}

/**
 * Valor em reais com máscara (digita só números: 150000 → "1.500,00").
 * Estado em centavos (`number | null`), igual ao banco.
 */
export function CurrencyField({
  value,
  onValueChange,
  ...props
}: WrapperProps &
  Omit<InputProps, "value" | "onChange" | "type"> & {
    value: number | null;
    onValueChange: (cents: number | null) => void;
  }) {
  const id = useId();
  return (
    <FieldWrapper
      id={id}
      label={props.label}
      hint={props.hint}
      className={props.className}
      required={props.required}
    >
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-fg-subtle">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          aria-describedby={props.hint ? `${id}-hint` : undefined}
          placeholder={props.placeholder ?? "0,00"}
          value={formatCentsPlain(value)}
          onChange={(e) => onValueChange(centsFromDigits(e.target.value))}
          className={`${inputClass} pl-10`}
          disabled={props.disabled}
          required={props.required}
          name={props.name}
        />
      </div>
    </FieldWrapper>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className" | "id">;

export function SelectField({
  label,
  hint,
  className,
  children,
  ...props
}: WrapperProps & SelectProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} className={className} required={props.required}>
      <select
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id">;

export function TextAreaField({ label, hint, className, ...props }: WrapperProps & TextAreaProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} className={className} required={props.required}>
      <textarea
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...props}
      />
    </FieldWrapper>
  );
}

/**
 * Checkbox com label à direita e dica opcional (opções liga/desliga em formulários).
 * Para mudanças que valem na hora (sem "Salvar"), prefira um botão de ação explícito.
 */
export function CheckboxField({
  label,
  hint,
  className,
  ...props
}: WrapperProps & Omit<InputProps, "type">) {
  const id = useId();
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="mt-0.5 size-4 shrink-0 rounded border-line-strong accent-primary"
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className={hintClass}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
