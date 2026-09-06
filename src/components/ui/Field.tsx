import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[11px] tracking-[0.16em] font-semibold text-cream-400">
        {label}
        {required && <span className="text-brand ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-brand" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-cream-600">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-lg border bg-coal-900 px-3.5 py-2.5 text-sm text-cream-100 placeholder:text-cream-600 outline-none transition-colors focus:border-gold-400 disabled:opacity-60";

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(CONTROL, invalid ? "border-brand" : "border-coal-700", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(CONTROL, "appearance-none pr-9 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23c9bfa8%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center]", invalid ? "border-brand" : "border-coal-700", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(CONTROL, "min-h-24 resize-y", invalid ? "border-brand" : "border-coal-700", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-2.5 text-sm text-cream-200 cursor-pointer", className)}>
      <input type="checkbox" className="h-4 w-4 rounded border-coal-700 bg-coal-900 accent-gold-400" {...rest} />
      {label}
    </label>
  );
}
