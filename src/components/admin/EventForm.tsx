"use client";

import { useActionState, useMemo, useState } from "react";
import { saveEventAction } from "@/lib/admin/events";
import type { ActionState } from "@/lib/auth/actions";
import type { EventRow, SeasonRow } from "@/lib/db/types";
import { slugify } from "@/lib/slug";
import { centsToEurosInput } from "@/lib/money";
import { isoToParisLocalInput } from "@/lib/tournaments/time";
import { Card } from "@/components/ui/Card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";

type Values = {
  title: string;
  slug: string;
  subtitle: string;
  status: string;
  season_id: string;
  format_label: string;
  starts_at: string;
  ends_at: string;
  registration_open_at: string;
  registration_close_at: string;
  venue_name: string;
  venue_address: string;
  city: string;
  google_maps_url: string;
  capacity: string;
  price_euros: string;
  fee_bps: string;
  rounds: string;
  cover_image_url: string;
  is_featured: boolean;
  counts_for_league: boolean;
  description: string;
  rules_text: string;
  schedule_text: string;
  prizes_text: string;
};

function fromEvent(e: EventRow | null, defaultSeasonId: string): Values {
  return {
    title: e?.title ?? "",
    slug: e?.slug ?? "",
    subtitle: e?.subtitle ?? "",
    status: e?.status ?? "draft",
    season_id: e?.season_id ?? defaultSeasonId,
    format_label: e?.format_label ?? "",
    starts_at: isoToParisLocalInput(e?.starts_at),
    ends_at: isoToParisLocalInput(e?.ends_at),
    registration_open_at: isoToParisLocalInput(e?.registration_open_at),
    registration_close_at: isoToParisLocalInput(e?.registration_close_at),
    venue_name: e?.venue_name ?? "Mister 8 TCG",
    venue_address: e?.venue_address ?? "",
    city: e?.city ?? "Courbevoie",
    google_maps_url: e?.google_maps_url ?? "",
    capacity: String(e?.capacity ?? 64),
    price_euros: centsToEurosInput(e?.price_cents ?? 3500),
    fee_bps: String(e?.fee_bps ?? 0),
    rounds: e?.rounds ? String(e.rounds) : "",
    cover_image_url: e?.cover_image_url ?? "",
    is_featured: e?.is_featured ?? false,
    counts_for_league: e?.counts_for_league ?? true,
    description: e?.description ?? "",
    rules_text: e?.rules_text ?? "",
    schedule_text: e?.schedule_text ?? "",
    prizes_text: e?.prizes_text ?? "",
  };
}

export default function EventForm({
  mode,
  event,
  seasons,
  templates,
  initialTemplateId,
}: {
  mode: "create" | "edit";
  event: EventRow | null;
  seasons: SeasonRow[];
  templates: EventRow[];
  initialTemplateId?: string;
}) {
  const [state, action] = useActionState(saveEventAction, {} as ActionState);
  const defaultSeason = seasons.find((s) => s.status === "active")?.id ?? seasons[0]?.id ?? "";
  const initialTemplate = initialTemplateId ? templates.find((t) => t.id === initialTemplateId) ?? null : null;
  const [v, setV] = useState<Values>(() => {
    const base = fromEvent(event ?? initialTemplate, defaultSeason);
    if (!event && initialTemplate) return { ...base, slug: "", status: "draft", starts_at: "", ends_at: "", registration_open_at: "", registration_close_at: "", is_featured: false };
    return base;
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(event?.slug));
  const autoSlug = useMemo(() => slugify(v.title), [v.title]);
  const fe = state.fieldErrors ?? {};

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setV((prev) => ({ ...prev, [k]: val }));
  };

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setV((prev) => ({
      ...fromEvent(t, defaultSeason),
      slug: "",
      status: "draft",
      starts_at: "",
      ends_at: "",
      registration_open_at: "",
      registration_close_at: "",
      is_featured: false,
      season_id: prev.season_id || defaultSeason,
    }));
    setSlugTouched(false);
  }

  return (
    <form action={action} className="space-y-5">
      {event && <input type="hidden" name="id" value={event.id} />}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}

      {mode === "create" && templates.length > 0 && (
        <Card tone="subtle" padding="sm">
          <Field label="Dupliquer depuis un tournoi existant" htmlFor="tpl" hint="Copie les textes, le lieu, le tarif et la capacité. Pensez à définir les dates.">
            <Select id="tpl" defaultValue={initialTemplateId ?? ""} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— Partir de zéro —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({isoToParisLocalInput(t.starts_at).slice(0, 10)})
                </option>
              ))}
            </Select>
          </Field>
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Informations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titre" htmlFor="f-title" required error={fe.title}>
            <Input id="f-title" name="title" value={v.title} onChange={set("title")} placeholder="Tournoi One Piece OP16 · Septembre" required />
          </Field>
          <Field label="Slug (URL)" htmlFor="f-slug" required error={fe.slug} hint={`/tournois/${v.slug || autoSlug || "…"}`}>
            <Input
              id="f-slug"
              name="slug"
              value={slugTouched ? v.slug : autoSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setV((p) => ({ ...p, slug: e.target.value }));
              }}
              placeholder={autoSlug}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Statut" htmlFor="f-status" error={fe.status} hint="« Terminé » est appliqué automatiquement à la publication des résultats.">
            <Select id="f-status" name="status" value={v.status} onChange={set("status")}>
              <option value="draft">Brouillon (invisible)</option>
              <option value="published">Publié</option>
              <option value="cancelled">Annulé</option>
              {mode === "edit" && <option value="completed">Terminé</option>}
            </Select>
          </Field>
          <Field label="Saison" htmlFor="f-season" hint="Détermine le barème des points.">
            <Select id="f-season" name="season_id" value={v.season_id} onChange={set("season_id")}>
              <option value="">— Hors saison —</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status === "active" ? " (active)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Format" htmlFor="f-format" hint="Ex. OP16, OP14-EB04">
            <Input id="f-format" name="format_label" value={v.format_label} onChange={set("format_label")} />
          </Field>
        </div>
        <Field label="Sous-titre" htmlFor="f-subtitle" hint="Une phrase d'accroche sur la fiche.">
          <Input id="f-subtitle" name="subtitle" value={v.subtitle} onChange={set("subtitle")} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Checkbox name="counts_for_league" checked={v.counts_for_league} onChange={set("counts_for_league")} label="Compte pour la ligue" />
          <Checkbox name="is_featured" checked={v.is_featured} onChange={set("is_featured")} label="Mettre en avant sur l'accueil" />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Dates (heure de Paris)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Début" htmlFor="f-start" required error={fe.starts_at}>
            <Input id="f-start" name="starts_at" type="datetime-local" value={v.starts_at} onChange={set("starts_at")} required />
          </Field>
          <Field label="Fin" htmlFor="f-end" error={fe.ends_at}>
            <Input id="f-end" name="ends_at" type="datetime-local" value={v.ends_at} onChange={set("ends_at")} />
          </Field>
          <Field label="Ouverture des inscriptions" htmlFor="f-open" error={fe.registration_open_at} hint="Vide = dès la publication.">
            <Input id="f-open" name="registration_open_at" type="datetime-local" value={v.registration_open_at} onChange={set("registration_open_at")} />
          </Field>
          <Field label="Clôture des inscriptions" htmlFor="f-close" error={fe.registration_close_at} hint="Vide = jusqu'au début du tournoi.">
            <Input id="f-close" name="registration_close_at" type="datetime-local" value={v.registration_close_at} onChange={set("registration_close_at")} />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Lieu</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom du lieu" htmlFor="f-venue">
            <Input id="f-venue" name="venue_name" value={v.venue_name} onChange={set("venue_name")} />
          </Field>
          <Field label="Ville" htmlFor="f-city">
            <Input id="f-city" name="city" value={v.city} onChange={set("city")} />
          </Field>
        </div>
        <Field label="Adresse" htmlFor="f-address">
          <Textarea id="f-address" name="venue_address" value={v.venue_address} onChange={set("venue_address")} rows={2} />
        </Field>
        <Field label="Lien Google Maps" htmlFor="f-maps">
          <Input id="f-maps" name="google_maps_url" value={v.google_maps_url} onChange={set("google_maps_url")} placeholder="https://maps.app.goo.gl/…" />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Places et tarif</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Capacité" htmlFor="f-cap" required error={fe.capacity} hint="0 = illimitée">
            <Input id="f-cap" name="capacity" type="number" min={0} value={v.capacity} onChange={set("capacity")} required />
          </Field>
          <Field label="Prix (€)" htmlFor="f-price" hint="0 = gratuit">
            <Input id="f-price" name="price_euros" inputMode="decimal" value={v.price_euros} onChange={set("price_euros")} />
          </Field>
          <Field label="Frais de paiement (bps)" htmlFor="f-fee" hint="500 = 5 % ajoutés au tarif">
            <Input id="f-fee" name="fee_bps" type="number" min={0} value={v.fee_bps} onChange={set("fee_bps")} />
          </Field>
          <Field label="Rondes suisses" htmlFor="f-rounds" hint="Prérempli à l'import des résultats.">
            <Input id="f-rounds" name="rounds" type="number" min={1} value={v.rounds} onChange={set("rounds")} />
          </Field>
        </div>
        <Field label="Image de couverture (URL)" htmlFor="f-cover" hint="Facultatif.">
          <Input id="f-cover" name="cover_image_url" value={v.cover_image_url} onChange={set("cover_image_url")} placeholder="https://…" />
        </Field>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Contenu de la fiche</h2>
        <Field label="Description" htmlFor="f-desc">
          <Textarea id="f-desc" name="description" value={v.description} onChange={set("description")} rows={4} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Règles du tournoi" htmlFor="f-rules">
            <Textarea id="f-rules" name="rules_text" value={v.rules_text} onChange={set("rules_text")} rows={6} />
          </Field>
          <Field label="Déroulé" htmlFor="f-schedule">
            <Textarea id="f-schedule" name="schedule_text" value={v.schedule_text} onChange={set("schedule_text")} rows={6} />
          </Field>
          <Field label="Dotation" htmlFor="f-prizes">
            <Textarea id="f-prizes" name="prizes_text" value={v.prizes_text} onChange={set("prizes_text")} rows={6} />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-panel border hairline bg-coal-900/95 px-5 py-3.5 backdrop-blur">
        <p className="text-xs text-cream-600">{mode === "create" ? "Créez en brouillon, puis publiez quand la fiche est prête." : "Les modifications sont visibles immédiatement."}</p>
        <SubmitButton pendingText="Enregistrement…">{mode === "create" ? "Créer le tournoi" : "Enregistrer"}</SubmitButton>
      </div>
    </form>
  );
}
