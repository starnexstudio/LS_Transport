export type ServiceDetail = {
  slug: string;
  introduction: string;
  scope: { title: string; text: string }[];
  preparation: string[];
  priceFactors: string;
  question: string;
  answer: string;
};
export const serviceDetails: ServiceDetail[] = [
  {
    slug: "clearance",
    introduction:
      "Wenn sich Dinge angesammelt haben oder ein Raum eine neue Aufgabe bekommen soll, hilft ein klarer Schnitt. Wir unterstützen Sie bei der Entrümpelung – vom einzelnen Bereich bis zu mehreren Räumen nach Absprache.",
    scope: [
      {
        title: "Wohnräume freimachen",
        text: "Teilen Sie uns mit, welche Möbel und Gegenstände entfernt werden sollen. Was Sie behalten möchten, wird vor dem Auftrag eindeutig abgestimmt.",
      },
      {
        title: "Keller und Dachboden räumen",
        text: "Auch Nebenräume können Teil Ihrer Anfrage sein. Treppen, niedrige Durchgänge und längere Tragewege berücksichtigen wir bei der Planung.",
      },
      {
        title: "Abbau und Entsorgung mitdenken",
        text: "Wenn Möbel vor dem Abtransport zerlegt werden müssen oder eine Entsorgung gewünscht ist, fragen Sie diese Leistungen direkt mit an.",
      },
    ],
    preparation: [
      "Einsatzort und betroffene Räume nennen",
      "Ungefähre Menge beschreiben oder Fotos bereithalten",
      "Gegenstände markieren, die bleiben sollen",
      "Etage, Aufzug und Parkmöglichkeiten angeben",
    ],
    priceFactors:
      "Der Umfang der Räumung, die Art und Menge der Gegenstände, der Zugang sowie zusätzlich vereinbarte Demontage- und Entsorgungsarbeiten fließen in die individuelle Preisabsprache ein.",
    question: "Muss vor der Entrümpelung alles sortiert sein?",
    answer:
      "Bitte legen Sie vorab fest, was bleiben soll. Wie viel Vorbereitung darüber hinaus sinnvoll ist, besprechen wir anhand Ihrer Situation. Persönliche Dokumente und Dinge, die Sie behalten möchten, sollten Sie separat aufbewahren.",
  },
  {
    slug: "disposal",
    introduction:
      "Nach einer Räumung oder Demontage stellt sich die Frage: Wohin mit den Materialien? Wir übernehmen die fachgerechte Entsorgung im vereinbarten Umfang und klären vorab, was anfällt.",
    scope: [
      {
        title: "Materialien erfassen",
        text: "Möbel, Holz, Metall oder gemischte Gegenstände: Beschreiben Sie die anfallenden Materialien möglichst genau, damit die Entsorgung passend geplant werden kann.",
      },
      {
        title: "Mit Räumung verbinden",
        text: "Die Entsorgung kann zusammen mit einer Entrümpelung oder Demontage angefragt werden. So werden Abbau, Abtransport und Entsorgung gemeinsam abgestimmt.",
      },
      {
        title: "Besonderheiten vorab klären",
        text: "Unbekannte Stoffe, Flüssigkeiten oder besondere Materialien bitte ausdrücklich angeben. Ob wir diese übernehmen können, muss vor einer Beauftragung geklärt sein.",
      },
    ],
    preparation: [
      "Materialarten und ungefähre Mengen angeben",
      "Fotos der Gegenstände bereithalten",
      "Besondere oder unbekannte Stoffe nennen",
      "Standort und Zugang zur Abholung beschreiben",
    ],
    priceFactors:
      "Die Materialart, Menge, erforderlichen Tragewege und die vereinbarte Abholung beeinflussen den Aufwand. Deshalb stimmen wir den Preis individuell für Ihren Auftrag ab.",
    question: "Kann jede Art von Material mitgenommen werden?",
    answer:
      "Eine pauschale Zusage ist nicht möglich. Bitte nennen Sie alle Materialarten bereits bei der Anfrage. Für besondere Stoffe klären wir zunächst, ob und unter welchen Bedingungen eine Übernahme möglich ist.",
  },
  {
    slug: "dismantling",
    introduction:
      "Vor der Renovierung muss Altes raus. Wir bauen zurück, sortieren und entsorgen – vom Boden bis zur Decke.",
    scope: [
      {
        title: "Böden, Fliesen & Wände",
        text: "Parkett, Laminat, Teppich, Fliesen, Tapeten sowie Decken- und Wandverkleidungen.",
      },
      {
        title: "Bad, Küche & Türen",
        text: "Badewannen, Waschbecken, WC und Armaturen, Küchen, Türen und Zargen.",
      },
      {
        title: "Einbauten & Entsorgung",
        text: "Einbauten und nichttragende Trockenbauelemente – anschließend sortiert und entsorgt.",
      },
    ],
    preparation: [
      "Bauteile oder Einbauten mit Fotos beschreiben",
      "Maße und bekannte Befestigungen nennen",
      "Anschlüsse oder Leitungen im Arbeitsbereich angeben",
      "Festlegen, welche Teile erhalten bleiben sollen",
    ],
    priceFactors:
      "Art, Größe und Befestigung der zu demontierenden Teile sowie Zugänglichkeit, Abtransport und gewünschte Entsorgung bestimmen den Umfang der Preisabsprache.",
    question: "Sind Elektro- oder Sanitäranschlüsse eingeschlossen?",
    answer:
      "Arbeiten an Elektro-, Gas- oder Wasseranschlüssen sind nicht pauschal Bestandteil der Demontage. Vorhandene Anschlüsse müssen Sie bei der Anfrage nennen; erforderliche Facharbeiten und Zuständigkeiten werden vor Beginn geklärt.",
  },
  {
    slug: "furniture-transport",
    introduction:
      "Ein Möbelstück wechselt den Standort, eine Lieferung steht an oder mehrere Möbel sollen mit umziehen. Wir stimmen Ihren Möbeltransport von der Abholadresse bis zum Ziel mit Ihnen ab.",
    scope: [
      {
        title: "Abholung abstimmen",
        text: "Wir klären, welche Möbel transportiert werden sollen, wo sie stehen und wie sie erreichbar sind. Bitte nennen Sie auch besondere Maße oder ein bekanntes hohes Gewicht.",
      },
      {
        title: "Lieferung vorbereiten",
        text: "Am Ziel sind Etage, Aufzug, Zufahrt und mögliche Tragewege wichtig. Diese Angaben gehören ebenso zur Planung wie die Strecke zwischen den Adressen.",
      },
      {
        title: "Mit Räumung verbinden",
        text: "Transport, Entrümpelung und Reinigung lassen sich in einem Auftrag kombinieren.",
      },
    ],
    preparation: [
      "Abhol- und Zielort einschließlich Etagen nennen",
      "Anzahl und Maße der Möbel angeben",
      "Zugänge, Aufzüge und Parkmöglichkeiten beschreiben",
      "Gewünschten Termin und mögliche Alternativen nennen",
    ],
    priceFactors:
      "Transportstrecke, Anzahl und Abmessungen der Möbel sowie der Zugang an beiden Orten werden bei der individuellen Preisabsprache berücksichtigt.",
    question: "Transportieren Sie auch einzelne Möbelstücke?",
    answer:
      "Sie können auch den Transport eines einzelnen Möbelstücks anfragen. Nennen Sie dafür Maße, Abholort und Zieladresse. Ob der Auftrag und Ihr Wunschtermin möglich sind, klären wir persönlich.",
  },
  {
    slug: "cleaning",
    introduction:
      "Wenn die Räume leer sind, machen wir sauber. So übergeben Sie Wohnung, Keller oder Gewerberaum besenrein.",
    scope: [
      {
        title: "Direkt nach der Räumung",
        text: "Die Reinigung folgt im Anschluss an Entrümpelung, Demontage oder Transport – ohne zweiten Termin.",
      },
      {
        title: "Besenreine Übergabe",
        text: "Böden, Flächen und Nebenräume werden für die Übergabe an Vermieter oder Käufer vorbereitet.",
      },
      {
        title: "Alle Raumarten",
        text: "Wohnungen, Häuser, Keller, Dachböden und Gewerberäume.",
      },
    ],
    preparation: [
      "Größe der Räume ungefähr angeben",
      "Gewünschten Übergabetermin nennen",
      "Besondere Verschmutzungen erwähnen",
    ],
    priceFactors:
      "Fläche, Zustand der Räume und der gewünschte Termin bestimmen den Aufwand.",
    question: "Kann die Reinigung mit der Räumung kombiniert werden?",
    answer:
      "Ja. Am einfachsten fragen Sie Räumung und Reinigung zusammen an – dann planen wir beides in einem Ablauf.",
  },
];
