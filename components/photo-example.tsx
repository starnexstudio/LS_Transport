import Image from "next/image";
import { asset } from "@/lib/base-path";
export function PhotoExample() {
  return (
    <section className="section photo-example" id="transportvorbereitung">
      <div className="photo-example-intro">
        <div>
          <span className="eyebrow">FURNITURE TRANSPORT & DELIVERY</span>
          <h2>
            All packed.
            <br />
            Ready for the next step.
          </h2>
        </div>
        <p>
          We carefully pack, protect, and secure your furniture for safe
          transport, from collection to delivery.
        </p>
      </div>
      <figure>
        <div className="moving-photo-grid">
          <div className="moving-photo">
            <Image
              src={asset("/images/packed-moving-boxes.jpg")}
              alt="Bright living room with sealed moving boxes, a suitcase and a covered armchair"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Carefully packed for transport</span>
          </div>
          <div className="moving-photo">
            <Image
              src={asset("/images/wrapped-living-room.jpg")}
              alt="Living room with a sofa and armchairs covered in protective film"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Furniture protected throughout the move</span>
          </div>
        </div>
      </figure>
    </section>
  );
}
