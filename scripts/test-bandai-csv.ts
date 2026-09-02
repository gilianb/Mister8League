// Test rapide du parseur : node --experimental-strip-types scripts/test-bandai-csv.ts
import { parseBandaiCsv, computeLeaguePoints, DEFAULT_SCALE } from "../src/lib/bandai-csv.ts";

const sample = `Classement,Numéro de membre,Nom du joueur,Points gagnants,OMW %,OOMW %
1,0000792617,Zoro_s93,9,66.7%,66.7%
2,0000790482,EMIMI98,9,44.4%,66.6%
3,0000848692,Kankimokichi,6,66.7%,59.2%
4,0000796115,Akalashtouille,6,66.7%,55.6%
5,0000273418,Saiten,6,55.6%,48%
6,0000792698,Futx04,6,55.4%,59.3%`;

const rows = parseBandaiCsv(sample, 3);

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "OK " : "FAIL"} ${label} — attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
}

check("nombre de lignes", rows.length, 6);
check("1er : nom", rows[0].playerName, "Zoro_s93");
check("1er : ID membre", rows[0].bandaiMemberId, "0000792617");
check("1er : bilan 3-0", [rows[0].wins, rows[0].draws, rows[0].losses], [3, 0, 0]);
check("3e : bilan 2-1", [rows[2].wins, rows[2].draws, rows[2].losses], [2, 0, 1]);
check("1er : OMW", rows[0].omwPct, 66.7);
check("5e : OOMW 48%", rows[4].oomwPct, 48);
check("points 1er", computeLeaguePoints(1, DEFAULT_SCALE), 15);
check("points 4e (top 4)", computeLeaguePoints(4, DEFAULT_SCALE), 8);
check("points 9e (top 16)", computeLeaguePoints(9, DEFAULT_SCALE), 4);
check("points 40e (top 33-64)", computeLeaguePoints(40, DEFAULT_SCALE), 1);
check("points 20e (top 32)", computeLeaguePoints(20, DEFAULT_SCALE), 2);
check("points 70e (hors bareme)", computeLeaguePoints(70, DEFAULT_SCALE), 0);

// Variante : séparateur ; et en-têtes EN
const sampleEn = `Standing;Membership Number;Player Name;Win Points;OMW %;OOMW %
1;0000111222;TestPlayer;9;60%;55%`;
const en = parseBandaiCsv(sampleEn, 3);
check("variante EN/; : nom", en[0].playerName, "TestPlayer");
check("variante EN/; : bilan", [en[0].wins, en[0].losses], [3, 0]);

if (failures > 0) {
  console.error(`\n${failures} échec(s)`);
  process.exit(1);
}
console.log("\nTous les tests passent.");
