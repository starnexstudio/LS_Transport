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
      "Bevor Neues entstehen kann, muss Vorhandenes manchmal weichen. Wir übernehmen abgestimmte Demontagearbeiten und berücksichtigen dabei den Zugang und die Gegebenheiten vor Ort.",
    scope: [
      {
        title: "Den Umfang festlegen",
        text: "Welche Teile sollen demontiert werden, welche bleiben bestehen? Gemeinsam grenzen wir die gewünschten Arbeiten ab und besprechen die Situation vor Ort.",
      },
      {
        title: "Die Demontage planen",
        text: "Maße, Befestigungen und Zugänglichkeit helfen bei der Einschätzung. Fotos und vorhandene Unterlagen können dafür eine gute Grundlage sein.",
      },
      {
        title: "Den nächsten Schritt organisieren",
        text: "Sollen die Teile aufbewahrt, transportiert oder entsorgt werden? Diese Schritte lassen sich nach Absprache mit dem Auftrag verbinden.",
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
        title: "Montage ergänzen",
        text: "Wenn ein Möbelstück vor dem Transport zerlegt und am Ziel wieder aufgebaut werden soll, fragen Sie Demontage und Montage direkt mit an.",
      },
    ],
    preparation: [
      "Abhol- und Zielort einschließlich Etagen nennen",
      "Anzahl und Maße der Möbel angeben",
      "Zugänge, Aufzüge und Parkmöglichkeiten beschreiben",
      "Gewünschten Termin und mögliche Alternativen nennen",
    ],
    priceFactors:
      "Transportstrecke, Anzahl und Abmessungen der Möbel, Zugang an beiden Orten sowie zusätzliche Montagearbeiten werden bei der individuellen Preisabsprache berücksichtigt.",
    question: "Transportieren Sie auch einzelne Möbelstücke?",
    answer:
      "Sie können auch den Transport eines einzelnen Möbelstücks anfragen. Nennen Sie dafür Maße, Abholort und Zieladresse. Ob der Auftrag und Ihr Wunschtermin möglich sind, klären wir persönlich.",
  },
  {
    slug: "furniture-assembly",
    introduction:
      "Neue Möbel aufbauen oder vorhandene für einen Standortwechsel zerlegen: Wir unterstützen Sie bei Möbelmontage und Möbeldemontage. Die konkreten Arbeiten stimmen wir anhand Ihrer Möbel ab.",
    scope: [
      {
        title: "Neue Möbel montieren",
        text: "Teilen Sie uns Möbelart, Modell und Anzahl mit. Eine Montageanleitung oder ein Produktlink hilft dabei, den benötigten Aufwand einzuschätzen.",
      },
      {
        title: "Vorhandene Möbel demontieren",
        text: "Vor einem Umzug oder einer Räumung kann ein Abbau nötig sein. Wir klären, ob und wie die Möbel zerlegt werden sollen und welche Teile erhalten bleiben.",
      },
      {
        title: "Aufbau und Transport verbinden",
        text: "Für einen Standortwechsel können Sie Abbau, Möbeltransport und erneuten Aufbau gemeinsam anfragen. Die Durchführbarkeit wird für Ihren Auftrag geprüft.",
      },
    ],
    preparation: [
      "Möbelart, Modell und Anzahl angeben",
      "Montageanleitung oder Produktlink bereithalten",
      "Fotos vorhandener Möbel und des Stellplatzes ergänzen",
      "Benötigte Wandbefestigungen oder Anschlüsse nennen",
    ],
    priceFactors:
      "Anzahl, Konstruktion und Zustand der Möbel sowie gewünschte Befestigungen, Demontage und zusätzliche Transportleistungen beeinflussen die individuelle Preisabsprache.",
    question: "Können ältere Möbel wieder aufgebaut werden?",
    answer:
      "Das hängt von Konstruktion, Zustand und vorhandenen Verbindungsteilen ab. Bitte senden Sie dazu eine Beschreibung und Fotos. Eine Zusage zum Wiederaufbau erfolgt erst nach Abstimmung.",
  },
];
