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
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-cream-300">
        {label}
        {required && (
          <span className="ml-1 text-brand" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-relaxed text-cream-600">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-control border bg-coal-950 px-3.5 text-[15px] text-cream-100 placeholder:text-cream-600 outline-none transition-[border-color,box-shadow] duration-150 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/25 disabled:opacity-60";

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(CONTROL, "h-11", invalid ? "border-brand" : "border-coal-700", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        CONTROL,
        "h-11 appearance-none pr-10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23c9bfa8%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-position-[right_0.875rem_center]",
        invalid ? "border-brand" : "border-coal-700",
        className
      )}
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
      className={cn(CONTROL, "min-h-28 resize-y py-2.5 leading-relaxed", invalid ? "border-brand" : "border-coal-700", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Checkbox({ label, className, tone = "club", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; tone?: "club" | "paper" }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-start gap-3 text-sm leading-relaxed", tone === "paper" ? "text-ink-600" : "text-cream-200", className)}>
      <input type="checkbox" className={cn("mt-1 size-4 shrink-0 rounded", tone === "paper" ? "accent-poster" : "border-coal-700 bg-coal-950 accent-gold-400")} {...rest} />
      <span>{label}</span>
    </label>
  );
}
