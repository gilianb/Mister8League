// Catalogue des leaders One Piece Card Game.
// Généré par scripts/build-leaders-catalog.mjs — ne pas éditer à la main.

export type LeaderColor = "Rouge" | "Vert" | "Bleu" | "Violet" | "Noir" | "Jaune";

export type Leader = {
  code: string;
  name: string;
  colors: LeaderColor[];
  life: number | null;
  /** Chemin public du visuel de la carte */
  image: string;
};

export const LEADERS: Leader[] = [
  {
    "code": "EB01-001",
    "name": "Kouzuki Oden",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/EB01-001.jpg"
  },
  {
    "code": "EB01-021",
    "name": "Hannyabal",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/EB01-021.jpg"
  },
  {
    "code": "EB01-040",
    "name": "Kyros",
    "colors": [
      "Noir",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/EB01-040.jpg"
  },
  {
    "code": "EB02-010",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Vert",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/EB02-010.jpg"
  },
  {
    "code": "EB03-001",
    "name": "Nefeltari Vivi",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/EB03-001.webp"
  },
  {
    "code": "EB04-001",
    "name": "Jewelry Bonney",
    "colors": [
      "Rouge",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/EB04-001.webp"
  },
  {
    "code": "OP01-001",
    "name": "Roronoa Zoro",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP01-001.png"
  },
  {
    "code": "OP01-002",
    "name": "Trafalgar Law",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP01-002.jpg"
  },
  {
    "code": "OP01-003",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP01-003.jpg"
  },
  {
    "code": "OP01-031",
    "name": "Kouzuki Oden",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP01-031.jpg"
  },
  {
    "code": "OP01-060",
    "name": "Donquixote Doflamingo",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP01-060.jpg"
  },
  {
    "code": "OP01-061",
    "name": "Kaido",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP01-061.jpg"
  },
  {
    "code": "OP01-062",
    "name": "Crocodile",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP01-062.jpg"
  },
  {
    "code": "OP01-091",
    "name": "King",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP01-091.jpg"
  },
  {
    "code": "OP02-001",
    "name": "Edward.Newgate",
    "colors": [
      "Rouge"
    ],
    "life": 6,
    "image": "/leaders/OP02-001.jpg"
  },
  {
    "code": "OP02-002",
    "name": "Monkey.D.Garp",
    "colors": [
      "Rouge",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP02-002.jpg"
  },
  {
    "code": "OP02-025",
    "name": "Kin'emon",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP02-025.jpg"
  },
  {
    "code": "OP02-026",
    "name": "Sanji",
    "colors": [
      "Vert",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/OP02-026.jpg"
  },
  {
    "code": "OP02-049",
    "name": "Emporio.Ivankov",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP02-049.jpg"
  },
  {
    "code": "OP02-071",
    "name": "Magellan",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP02-071.jpg"
  },
  {
    "code": "OP02-072",
    "name": "Zephyr",
    "colors": [
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP02-072.jpg"
  },
  {
    "code": "OP02-093",
    "name": "Smoker",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP02-093.jpg"
  },
  {
    "code": "OP03-001",
    "name": "Portgas.D.Ace",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP03-001.jpg"
  },
  {
    "code": "OP03-021",
    "name": "Kuro",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP03-021.jpg"
  },
  {
    "code": "OP03-022",
    "name": "Arlong",
    "colors": [
      "Vert",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP03-022.jpg"
  },
  {
    "code": "OP03-040",
    "name": "Nami",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP03-040.jpg"
  },
  {
    "code": "OP03-058",
    "name": "Iceburg",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP03-058.jpg"
  },
  {
    "code": "OP03-076",
    "name": "Rob Lucci",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP03-076.jpg"
  },
  {
    "code": "OP03-077",
    "name": "Charlotte Linlin",
    "colors": [
      "Jaune",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP03-077.jpg"
  },
  {
    "code": "OP03-099",
    "name": "Charlotte Katakuri",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP03-099.jpg"
  },
  {
    "code": "OP04-001",
    "name": "Nefeltari Vivi",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP04-001.jpg"
  },
  {
    "code": "OP04-019",
    "name": "Donquixote Doflamingo",
    "colors": [
      "Vert",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP04-019.jpg"
  },
  {
    "code": "OP04-020",
    "name": "Issho",
    "colors": [
      "Vert",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP04-020.jpg"
  },
  {
    "code": "OP04-039",
    "name": "Rebecca",
    "colors": [
      "Bleu",
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP04-039.jpg"
  },
  {
    "code": "OP04-040",
    "name": "Queen",
    "colors": [
      "Bleu",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP04-040.jpg"
  },
  {
    "code": "OP04-058",
    "name": "Crocodile",
    "colors": [
      "Violet",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP04-058.jpg"
  },
  {
    "code": "OP05-001",
    "name": "Sabo",
    "colors": [
      "Rouge",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP05-001.jpg"
  },
  {
    "code": "OP05-002",
    "name": "Belo Betty",
    "colors": [
      "Rouge",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP05-002.jpg"
  },
  {
    "code": "OP05-022",
    "name": "Donquixote Rosinante",
    "colors": [
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP05-022.jpg"
  },
  {
    "code": "OP05-041",
    "name": "Sakazuki",
    "colors": [
      "Bleu",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP05-041.jpg"
  },
  {
    "code": "OP05-060",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Violet",
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP05-060.jpg"
  },
  {
    "code": "OP05-098",
    "name": "Enel",
    "colors": [
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP05-098.jpg"
  },
  {
    "code": "OP06-001",
    "name": "Uta",
    "colors": [
      "Rouge"
    ],
    "life": 4,
    "image": "/leaders/OP06-001.jpg"
  },
  {
    "code": "OP06-020",
    "name": "Hody Jones",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP06-020.jpg"
  },
  {
    "code": "OP06-021",
    "name": "Perona",
    "colors": [
      "Vert",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP06-021.jpg"
  },
  {
    "code": "OP06-022",
    "name": "Yamato",
    "colors": [
      "Vert",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP06-022.png"
  },
  {
    "code": "OP06-042",
    "name": "Vinsmoke Reiju",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP06-042.jpg"
  },
  {
    "code": "OP06-080",
    "name": "Gecko Moria",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP06-080.jpg"
  },
  {
    "code": "OP07-001",
    "name": "Monkey.D.Dragon",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP07-001.jpg"
  },
  {
    "code": "OP07-019",
    "name": "Jewelry Bonney",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP07-019.png"
  },
  {
    "code": "OP07-038",
    "name": "Boa Hancock",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP07-038.jpg"
  },
  {
    "code": "OP07-059",
    "name": "Foxy",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP07-059.jpg"
  },
  {
    "code": "OP07-079",
    "name": "Rob Lucci",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP07-079.jpg"
  },
  {
    "code": "OP07-097",
    "name": "Vegapunk",
    "colors": [
      "Jaune"
    ],
    "life": 2,
    "image": "/leaders/OP07-097.jpg"
  },
  {
    "code": "OP08-001",
    "name": "Tony Tony.Chopper",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP08-001.jpg"
  },
  {
    "code": "OP08-002",
    "name": "Marco",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/OP08-002.jpg"
  },
  {
    "code": "OP08-021",
    "name": "Carrot",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP08-021.jpg"
  },
  {
    "code": "OP08-057",
    "name": "King",
    "colors": [
      "Violet",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP08-057.jpg"
  },
  {
    "code": "OP08-058",
    "name": "Charlotte Pudding",
    "colors": [
      "Violet",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP08-058.jpg"
  },
  {
    "code": "OP08-098",
    "name": "Kalgara",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP08-098.jpg"
  },
  {
    "code": "OP09-001",
    "name": "Shanks",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP09-001.png"
  },
  {
    "code": "OP09-022",
    "name": "Lim",
    "colors": [
      "Vert",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP09-022.jpg"
  },
  {
    "code": "OP09-042",
    "name": "Buggy",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP09-042.png"
  },
  {
    "code": "OP09-061",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Violet",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP09-061.png"
  },
  {
    "code": "OP09-062",
    "name": "Nico Robin",
    "colors": [
      "Violet",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP09-062.jpg"
  },
  {
    "code": "OP09-081",
    "name": "Marshall.D.Teach",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP09-081.png"
  },
  {
    "code": "OP10-001",
    "name": "Smoker",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP10-001.jpg"
  },
  {
    "code": "OP10-002",
    "name": "Caesar Clown",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/OP10-002.jpg"
  },
  {
    "code": "OP10-003",
    "name": "Sugar",
    "colors": [
      "Rouge",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP10-003.jpg"
  },
  {
    "code": "OP10-022",
    "name": "Trafalgar Law",
    "colors": [
      "Vert",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP10-022.jpg"
  },
  {
    "code": "OP10-042",
    "name": "Usopp",
    "colors": [
      "Bleu",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP10-042.jpg"
  },
  {
    "code": "OP10-099",
    "name": "Eustass\"Captain\"Kid",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP10-099.jpg"
  },
  {
    "code": "OP11-001",
    "name": "Koby",
    "colors": [
      "Rouge",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP11-001.jpg"
  },
  {
    "code": "OP11-021",
    "name": "Jinbe",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP11-021.jpg"
  },
  {
    "code": "OP11-022",
    "name": "Shirahoshi",
    "colors": [
      "Vert",
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP11-022.jpg"
  },
  {
    "code": "OP11-040",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 3,
    "image": "/leaders/OP11-040.jpg"
  },
  {
    "code": "OP11-041",
    "name": "Nami",
    "colors": [
      "Bleu",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP11-041.jpg"
  },
  {
    "code": "OP11-062",
    "name": "Charlotte Katakuri",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP11-062.jpg"
  },
  {
    "code": "OP12-001",
    "name": "Silvers Rayleigh",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP12-001.jpg"
  },
  {
    "code": "OP12-020",
    "name": "Roronoa Zoro",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP12-020.jpg"
  },
  {
    "code": "OP12-040",
    "name": "Kuzan",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP12-040.jpg"
  },
  {
    "code": "OP12-041",
    "name": "Sanji",
    "colors": [
      "Bleu",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/OP12-041.jpg"
  },
  {
    "code": "OP12-061",
    "name": "Donquixote Rosinante",
    "colors": [
      "Violet",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP12-061.jpg"
  },
  {
    "code": "OP12-081",
    "name": "Koala",
    "colors": [
      "Noir",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP12-081.jpg"
  },
  {
    "code": "OP13-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP13-001.jpg"
  },
  {
    "code": "OP13-002",
    "name": "Portgas.D.Ace",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 3,
    "image": "/leaders/OP13-002.jpg"
  },
  {
    "code": "OP13-003",
    "name": "Gol.D.Roger",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP13-003.jpg"
  },
  {
    "code": "OP13-004",
    "name": "Sabo",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP13-004.jpg"
  },
  {
    "code": "OP13-079",
    "name": "Imu",
    "colors": [
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP13-079.jpg"
  },
  {
    "code": "OP13-100",
    "name": "Jewelry Bonney",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP13-100.jpg"
  },
  {
    "code": "OP14-001",
    "name": "Trafalgar Law",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP14-001.png"
  },
  {
    "code": "OP14-020",
    "name": "Dracule Mihawk",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/OP14-020.png"
  },
  {
    "code": "OP14-040",
    "name": "Jinbe",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP14-040.png"
  },
  {
    "code": "OP14-041",
    "name": "Boa Hancock",
    "colors": [
      "Bleu",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP14-041.png"
  },
  {
    "code": "OP14-060",
    "name": "Donquixote Doflamingo",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP14-060.png"
  },
  {
    "code": "OP14-079",
    "name": "Crocodile",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP14-079.png"
  },
  {
    "code": "OP14-080",
    "name": "Gecko Moria",
    "colors": [
      "Noir",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP14-080.png"
  },
  {
    "code": "OP15-001",
    "name": "Krieg",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/OP15-001.webp"
  },
  {
    "code": "OP15-002",
    "name": "Lucy",
    "colors": [
      "Rouge",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/OP15-002.webp"
  },
  {
    "code": "OP15-022",
    "name": "Brook",
    "colors": [
      "Vert",
      "Noir"
    ],
    "life": 4,
    "image": "/leaders/OP15-022.webp"
  },
  {
    "code": "OP15-039",
    "name": "Rebecca",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP15-039.webp"
  },
  {
    "code": "OP15-058",
    "name": "Enel",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP15-058.webp"
  },
  {
    "code": "OP15-098",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/OP15-098.webp"
  },
  {
    "code": "OP16-001",
    "name": "Portgas.D.Ace",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/OP16-001.jpg"
  },
  {
    "code": "OP16-022",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Vert",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/OP16-022.jpg"
  },
  {
    "code": "OP16-041",
    "name": "Buggy",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/OP16-041.jpg"
  },
  {
    "code": "OP16-060",
    "name": "Sengoku",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/OP16-060.jpg"
  },
  {
    "code": "OP16-079",
    "name": "Yamato",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/OP16-079.jpg"
  },
  {
    "code": "OP16-080",
    "name": "Marshall.D.Teach",
    "colors": [
      "Noir",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/OP16-080.jpg"
  },
  {
    "code": "PRB01-001",
    "name": "Sanji",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/PRB01-001.jpg"
  },
  {
    "code": "ST01-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/ST01-001.jpg"
  },
  {
    "code": "ST02-001",
    "name": "Eustass\"Captain\"Kid",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/ST02-001.png"
  },
  {
    "code": "ST03-001",
    "name": "Crocodile",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/ST03-001.png"
  },
  {
    "code": "ST04-001",
    "name": "Kaido",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/ST04-001.jpg"
  },
  {
    "code": "ST05-001",
    "name": "Shanks",
    "colors": [
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/ST05-001.jpg"
  },
  {
    "code": "ST06-001",
    "name": "Sakazuki",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/ST06-001.jpg"
  },
  {
    "code": "ST07-001",
    "name": "Charlotte Linlin",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/ST07-001.jpg"
  },
  {
    "code": "ST08-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/ST08-001.jpg"
  },
  {
    "code": "ST09-001",
    "name": "Yamato",
    "colors": [
      "Jaune"
    ],
    "life": 5,
    "image": "/leaders/ST09-001.jpg"
  },
  {
    "code": "ST10-001",
    "name": "Trafalgar Law",
    "colors": [
      "Rouge",
      "Violet"
    ],
    "life": 4,
    "image": "/leaders/ST10-001.jpg"
  },
  {
    "code": "ST10-002",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Rouge",
      "Violet"
    ],
    "life": 3,
    "image": "/leaders/ST10-002.jpg"
  },
  {
    "code": "ST10-003",
    "name": "Eustass\"Captain\"Kid",
    "colors": [
      "Rouge",
      "Violet"
    ],
    "life": 5,
    "image": "/leaders/ST10-003.jpg"
  },
  {
    "code": "ST11-001",
    "name": "Uta",
    "colors": [
      "Vert"
    ],
    "life": 5,
    "image": "/leaders/ST11-001.jpg"
  },
  {
    "code": "ST12-001",
    "name": "Roronoa Zoro & Sanji",
    "colors": [
      "Vert",
      "Bleu"
    ],
    "life": 4,
    "image": "/leaders/ST12-001.jpg"
  },
  {
    "code": "ST13-001",
    "name": "Sabo",
    "colors": [
      "Rouge",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/ST13-001.jpg"
  },
  {
    "code": "ST13-002",
    "name": "Portgas.D.Ace",
    "colors": [
      "Bleu",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/ST13-002.jpg"
  },
  {
    "code": "ST13-003",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Noir",
      "Jaune"
    ],
    "life": 4,
    "image": "/leaders/ST13-003.jpg"
  },
  {
    "code": "ST14-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Noir"
    ],
    "life": 5,
    "image": "/leaders/ST14-001.jpg"
  },
  {
    "code": "ST21-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Rouge"
    ],
    "life": 5,
    "image": "/leaders/ST21-001.jpg"
  },
  {
    "code": "ST22-001",
    "name": "Ace & Newgate",
    "colors": [
      "Bleu"
    ],
    "life": 5,
    "image": "/leaders/ST22-001.png"
  },
  {
    "code": "ST29-001",
    "name": "Monkey.D.Luffy",
    "colors": [
      "Jaune"
    ],
    "life": 6,
    "image": "/leaders/ST29-001.jpg"
  },
  {
    "code": "ST30-001",
    "name": "Luffy & Ace",
    "colors": [
      "Rouge",
      "Vert"
    ],
    "life": 4,
    "image": "/leaders/ST30-001.jpg"
  }
];

const byCode = new Map(LEADERS.map((l) => [l.code, l]));

export function getLeader(code: string | undefined | null): Leader | undefined {
  return code ? byCode.get(code.toUpperCase()) : undefined;
}
