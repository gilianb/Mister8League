import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLeaderName, normalizeLeaders, sameColors, translateColors, type OptcgCard } from "../src/lib/leaders/optcg.ts";

function card(partial: Partial<OptcgCard>): OptcgCard {
  return {
    card_name: "Roronoa Zoro (001)",
    card_set_id: "OP01-001",
    card_image_id: "OP01-001",
    card_image: "https://optcgapi.com/media/static/Card_Images/OP01-001.jpg",
    card_color: "Red",
    card_type: "Leader",
    set_name: "Romance Dawn",
    ...partial,
  };
}

test("nettoie les suffixes de numéro, de variante et de code", () => {
  assert.equal(cleanLeaderName("Roronoa Zoro (001)"), "Roronoa Zoro");
  assert.equal(cleanLeaderName("Crocodile (062) (Parallel)"), "Crocodile");
  assert.equal(cleanLeaderName("Monkey.D.Luffy (079) (Super Leader Alternate Art)"), "Monkey.D.Luffy");
  assert.equal(cleanLeaderName("Enel (OP15-058)"), "Enel");
  assert.equal(cleanLeaderName("Trafalgar Law - OP14-001 (Alternate Art)"), "Trafalgar Law");
  assert.equal(cleanLeaderName('Eustass"Captain"Kid (099)'), 'Eustass"Captain"Kid');
  assert.equal(cleanLeaderName("Luffy & Ace"), "Luffy & Ace");
});

test("traduit les couleurs en français, dans l'ordre de l'API", () => {
  assert.deepEqual(translateColors("Green Red"), ["Vert", "Rouge"]);
  assert.deepEqual(translateColors("Black"), ["Noir"]);
  assert.deepEqual(translateColors("Purple Yellow"), ["Violet", "Jaune"]);
  assert.deepEqual(translateColors(null), []);
});

test("compare les couleurs sans tenir compte de l'ordre", () => {
  assert.ok(sameColors(["Rouge", "Vert"], ["Vert", "Rouge"]));
  assert.ok(!sameColors(["Rouge"], ["Rouge", "Vert"]));
});

test("garde une impression par code, la version de base, et ignore les non-leaders", () => {
  const cards = [
    card({ card_name: "Roronoa Zoro (001) (Parallel)", card_image_id: "OP01-001_p1", card_image: "https://x/OP01-001_p1.jpg" }),
    card({}),
    card({ card_set_id: "OP01-077", card_image_id: "OP01-077", card_type: "Character", card_name: "Perona" }),
    // Deux lignes avec le même identifiant d'image : on écarte la « Parallel ».
    card({ card_set_id: "ST29-001", card_image_id: "ST29-001", card_name: "Monkey.D.Luffy (001) (Parallel)", card_image: "https://x/p.jpg", card_color: "Yellow" }),
    card({ card_set_id: "ST29-001", card_image_id: "ST29-001", card_name: "Monkey.D.Luffy (001)", card_image: "https://x/base.jpg", card_color: "Yellow" }),
    // Pas d'impression de base : on prend l'identifiant le plus court.
    card({ card_set_id: "OP02-072", card_image_id: "OP02-072_p2", card_name: "Zephyr (SPR)", card_image: "https://x/p2.jpg", card_color: "Black" }),
    card({ card_set_id: "OP02-072", card_image_id: "OP02-072_p1", card_name: "Zephyr (Alternate Art)", card_image: "https://x/p1.jpg", card_color: "Black" }),
  ];
  const leaders = normalizeLeaders(cards);
  assert.deepEqual(
    leaders.map((l) => [l.code, l.name, l.colors, l.imageSourceUrl]),
    [
      ["OP01-001", "Roronoa Zoro", ["Rouge"], "https://optcgapi.com/media/static/Card_Images/OP01-001.jpg"],
      ["OP02-072", "Zephyr", ["Noir"], "https://x/p1.jpg"],
      ["ST29-001", "Monkey.D.Luffy", ["Jaune"], "https://x/base.jpg"],
    ]
  );
});

test("met les codes en majuscules et ignore les lignes incomplètes", () => {
  const leaders = normalizeLeaders([
    card({ card_set_id: " op17-001 ", card_image_id: "OP17-001", card_name: "Edward.Newgate (001)" }),
    card({ card_set_id: "", card_image_id: "" }),
    card({ card_set_id: "OP17-020", card_image_id: "OP17-020", card_image: "" }),
  ]);
  assert.deepEqual(leaders.map((l) => l.code), ["OP17-001"]);
});
