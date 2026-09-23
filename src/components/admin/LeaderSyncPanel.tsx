"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncLeadersAction, type LeaderSyncReport } from "@/lib/admin/leaders";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export default function LeaderSyncPanel({ lastSyncLabel, pendingImages }: { lastSyncLabel: string | null; pendingImages: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [report, setReport] = useState<LeaderSyncReport | null>(null);

  function run() {
    start(async () => {
      const res = await syncLeadersAction();
      setReport(res);
      router.refresh();
    });
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-1">
          <h2 className="text-[15px] font-semibold text-cream-100">Synchroniser depuis optcgapi.com</h2>
          <p className="text-sm text-cream-400">
            Ajoute les leaders des nouvelles extensions et copie leurs visuels dans Supabase Storage. Les leaders existants ne sont
            jamais modifiés : les écarts avec l&apos;API sont seulement signalés, à corriger à la main ci-dessous si besoin.
          </p>
          <p className="text-xs text-cream-600">
            {lastSyncLabel ? `Dernière synchronisation : ${lastSyncLabel}` : "Jamais synchronisé."}
            {pendingImages > 0 && ` · ${pendingImages} visuel${pendingImages > 1 ? "s" : ""} encore hors Storage`}
          </p>
        </div>
        <Button onClick={run} pending={pending}>
          {pending ? "Synchronisation…" : "Synchroniser"}
        </Button>
      </div>

      {pending && <Alert tone="info">Téléchargement en cours. La première fois, comptez jusqu&apos;à une minute (copie de tous les visuels).</Alert>}

      {report && !pending && <SyncReport report={report} />}
    </Card>
  );
}

function SyncReport({ report }: { report: LeaderSyncReport }) {
  if (report.error) return <Alert tone="error" title="Synchronisation échouée">{report.error}</Alert>;
  const seconds = Math.round(report.durationMs / 1000);
  return (
    <div className="space-y-3">
      <Alert tone={report.errors.length > 0 || report.imagesRemaining > 0 ? "warn" : "success"} title={`Terminé en ${seconds} s`}>
        <ul className="list-disc pl-4">
          <li>{report.fetched} leaders lus sur optcgapi.com</li>
          <li>
            {report.added.length === 0
              ? "Aucun nouveau leader"
              : `${report.added.length} ajouté${report.added.length > 1 ? "s" : ""} : ${report.added.map((a) => `${a.code} ${a.name}`).join(", ")}`}
          </li>
          <li>{report.imagesUploaded} visuel{report.imagesUploaded > 1 ? "s" : ""} copié{report.imagesUploaded > 1 ? "s" : ""} dans Storage</li>
          {report.imagesRemaining > 0 && (
            <li>
              <strong>{report.imagesRemaining} visuels restants</strong> (limite de temps atteinte) : cliquez à nouveau sur Synchroniser.
            </li>
          )}
        </ul>
      </Alert>

      {report.errors.length > 0 && (
        <Alert tone="error" title={`${report.errors.length} erreur${report.errors.length > 1 ? "s" : ""}`}>
          <ul className="list-disc pl-4">
            {report.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      {report.divergences.length > 0 && (
        <details className="rounded-control border hairline px-4 py-3 text-sm">
          <summary className="cursor-pointer text-cream-200">
            {report.divergences.length} écart{report.divergences.length > 1 ? "s" : ""} avec l&apos;API (non appliqués)
          </summary>
          <p className="mt-2 text-xs text-cream-500">
            L&apos;API se trompe parfois. Vérifiez sur la carte avant de corriger un leader.
          </p>
          <ul className="mt-2 space-y-1 text-cream-300">
            {report.divergences.map((d) => (
              <li key={`${d.code}-${d.field}`}>
                <span className="font-mono text-xs text-cream-500">{d.code}</span> {d.field} : base « {d.db} », API « {d.api} »
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
