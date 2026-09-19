import { permanentRedirect } from "next/navigation";

// La politique de confidentialité (/confidentialite) est la page RGPD du
// site : /rgpd est conservée comme adresse alternative et y redirige.
export default function RgpdPage() {
  permanentRedirect("/confidentialite");
}
