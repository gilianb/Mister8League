import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TicketProps = HTMLAttributes<HTMLElement> & {
  /** Couleur du fond derrière le billet, pour découper les encoches. */
  bg?: string;
  as?: "article" | "section" | "div";
};

/**
 * Le billet : papier ivoire, coins arrondis. Composez-le avec un corps
 * (`TicketBody`) et un talon (`TicketStub`) séparés par une perforation.
 */
export function Ticket({ bg, as: Tag = "article", className, style, children, ...rest }: TicketProps) {
  const vars = bg ? ({ "--ticket-bg": bg } as CSSProperties) : undefined;
  return (
    <Tag className={cn("ticket flex flex-col", className)} style={{ ...vars, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export function TicketBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 p-6 sm:p-7", className)} {...rest}>
      {children}
    </div>
  );
}

/** Talon du billet. `notches={false}` quand le fond derrière n'est pas uni (photo). */
export function TicketStub({ className, children, notches = true, ...rest }: HTMLAttributes<HTMLDivElement> & { notches?: boolean }) {
  return (
    <div className={cn(notches ? "ticket-perforation" : "ticket-perforation-plain", "px-6 py-5 sm:px-7", className)} {...rest}>
      {children}
    </div>
  );
}
