/* Photo en filigrane en haut d'une page sombre, fondue vers le charbon. */

type Props = {
  src: string;
  /** Cadrage de la photo, ex. "50% 30%" */
  position?: string;
};

export default function PageBackdrop({ src, position = "50% 30%" }: Props) {
  return (
    <div
      className="absolute inset-x-0 top-0 h-105 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover opacity-[0.07]"
        style={{ objectPosition: position }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(34,31,28,.5), rgba(34,31,28,.25) 45%, #221f1c 100%)",
        }}
      />
    </div>
  );
}
