// Point d'entrée `--import` : installe le repli DNS dans chaque processus Node
// du serveur de développement (cf. scripts/dns-fallback.mjs et scripts/dev.mjs).
import { installDnsFallback } from "./dns-fallback.mjs";

installDnsFallback();
