import { Fragment, type CSSProperties } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { HeroRoom } from "@/components/hero-room";
import { HeroStage } from "@/components/hero-stage";
import { business } from "@/lib/content";

const copy =
  "Wir übernehmen die komplette Räumung – von der Planung bis zur besenreinen Übergabe.";

const order = (i: number) => ({ "--i": i }) as CSSProperties;

// A pinned stage: the headline rises in on load, then scrolling clears the
// room while the supporting sentence lights up word by word. When the room is
// empty, "Neues." is underlined. The calls to action are there from the start.
export function Hero() {
  const phone = business.phone.trim();
  return (
    <HeroStage>
      <div className="hero-intro">
        <p className="hero-label">Entrümpelung · Demontage · Transport</p>
        <h1 id="hero-title" className="hero-title">
          <span className="hero-word" style={order(0)}>
            <span>Wir</span>
          </span>{" "}
          <span className="hero-word" style={order(1)}>
            <span>machen</span>
          </span>
          <br className="hero-break-mobile" />{" "}
          <span className="hero-word" style={order(2)}>
            <span>Platz</span>
          </span>
          <br className="hero-break-tablet" />{" "}
          <span className="hero-word" style={order(3)}>
            <span>für</span>
          </span>{" "}
          <span className="hero-word hero-word-accent" style={order(4)}>
            <span>Neues.</span>
          </span>
        </h1>
        <p className="hero-text">
          {copy.split(" ").map((word, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span style={order(i)}>{word}</span>
            </Fragment>
          ))}
        </p>
      </div>
      <HeroRoom />
      <div className="hero-actions">
        <a href="#anfrage" className="hero-button hero-button-primary">
          Unverbindlich anfragen
          <ArrowRight
            size={18}
            strokeWidth={1.8333}
            absoluteStrokeWidth
            aria-hidden="true"
          />
        </a>
        {phone && (
          <a
            className="hero-button hero-button-outline"
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            aria-label={`Jetzt anrufen: ${phone}`}
          >
            <Phone
              size={17}
              strokeWidth={1.5}
              absoluteStrokeWidth
              aria-hidden="true"
            />
            Jetzt anrufen
          </a>
        )}
      </div>
      <p className="hero-note">
        <span aria-hidden="true" />
        Schnell, zuverlässig und stressfrei.
      </p>
      <div className="hero-progress" aria-hidden="true">
        <span />
      </div>
    </HeroStage>
  );
}
