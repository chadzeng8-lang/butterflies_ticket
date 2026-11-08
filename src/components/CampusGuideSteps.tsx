import Image from "next/image";
import type { CampusEntryStep } from "@/lib/campus-entry-guide";

export function CampusGuideSteps({
  steps,
  imageClassName = "campus-entry-image",
}: {
  steps: CampusEntryStep[];
  imageClassName?: string;
}) {
  return (
    <section className="campus-entry-steps">
      {steps.map((step, index) => (
        <article key={step.image} className="campus-entry-step">
          <div className="campus-entry-step-copy">
            <span className="campus-entry-step-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
            {step.tips && step.tips.length > 0 && (
              <ul className="campus-entry-tips">
                {step.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
          <figure className="campus-entry-figure">
            <Image
              src={step.image}
              alt={`步骤 ${index + 1}：${step.title}`}
              width={780}
              height={980}
              className={imageClassName}
              sizes="(max-width: 720px) 100vw, 420px"
            />
          </figure>
        </article>
      ))}
    </section>
  );
}
