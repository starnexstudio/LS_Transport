// Trust content: key numbers, the Google rating and customer reviews.
//
// SAMPLE CONTENT. None of these reviews, numbers or the rating come from L&S
// customers. They are retained for design reference. The home page leaves the
// stats band and reviews out in every environment while `sample` is true.
// To publish them, replace every entry with real data
// (e.g. from the Google Business profile) and set `sample` to false.
export const sample = true;
// The "Beispielinhalt" tag that marks this content on the dev server. Switched
// off for now; set to true to show it again.
export const markSample = false;

export type Stat = {
  /** Counted up from zero when the band comes into view. */
  value?: number;
  decimals?: number;
  suffix?: string;
  /** Shown as it is, for values that aren't counted (e.g. "24/7"). */
  text?: string;
  /** Five stars under the number (the rating). */
  stars?: boolean;
  label: string;
};

export const stats: Stat[] = [
  { value: 1250, suffix: "+", label: "Räumungen abgeschlossen" },
  { value: 4.9, decimals: 1, stars: true, label: "von 5 Sternen bei Google" },
  { value: 98, suffix: " %", label: "würden uns weiterempfehlen" },
  { text: "24/7", label: "erreichbar – auch am Wochenende" },
];

export const rating = { score: 4.9, count: 9, source: "Google" };

export type Review = {
  name: string;
  service: string;
  stars: number;
  text: string;
  when: string;
};

export const reviews: Review[] = [
  {
    name: "Sabine K.",
    service: "Haushaltsauflösung",
    stars: 5,
    text: "Die Wohnung meiner Mutter war in zwei Tagen komplett geräumt – besenrein, wie versprochen. Sehr respektvoller Umgang mit allem, was ihr wichtig war.",
    when: "vor 2 Wochen",
  },
  {
    name: "Markus T.",
    service: "Kellerentrümpelung",
    stars: 5,
    text: "Pünktlich, schnell und ein fester Preis vorab. Der Keller war nach drei Stunden leer.",
    when: "vor 1 Monat",
  },
  {
    name: "Aylin D.",
    service: "Demontage",
    stars: 5,
    text: "Küche und Einbauschränke sauber demontiert, nichts beschädigt, alles mitgenommen. Klare Empfehlung.",
    when: "vor 3 Wochen",
  },
  {
    name: "Jonas W.",
    service: "Möbeltransport",
    stars: 5,
    text: "Das Sofa durchs enge Treppenhaus in den vierten Stock – kein Kratzer an der Wand. Super Team!",
    when: "vor 2 Monaten",
  },
  {
    name: "Petra M.",
    service: "Entsorgung",
    stars: 5,
    text: "Alles wurde sortiert und fachgerecht entsorgt. Ich musste mich um gar nichts kümmern.",
    when: "vor 1 Woche",
  },
  {
    name: "Thomas R.",
    service: "Wohnungsräumung",
    stars: 5,
    text: "Sehr freundlich am Telefon, Termin schon in der nächsten Woche. Die Übergabe an den Vermieter lief problemlos.",
    when: "vor 1 Monat",
  },
  {
    name: "Elena S.",
    service: "Entrümpelung",
    stars: 4,
    text: "Faire Beratung und keine versteckten Kosten. Einen Tag später als geplant, dafür sehr gründlich.",
    when: "vor 2 Monaten",
  },
  {
    name: "Michael B.",
    service: "Dachbodenräumung",
    stars: 5,
    text: "Dachboden voller alter Möbel – an einem Vormittag erledigt und danach sogar gefegt.",
    when: "vor 3 Wochen",
  },
];
