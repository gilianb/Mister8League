"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
};

/** Bouton de soumission qui affiche l'état « en cours » d'une Server Action. */
export function SubmitButton({ children, pendingText, variant, size, className, disabled, formAction }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      pending={pending}
      disabled={disabled}
      formAction={formAction}
    >
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
