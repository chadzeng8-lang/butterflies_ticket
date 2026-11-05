import Link from "next/link";
import type { PersonalityCharacter } from "@/lib/personality";

export function PersonalityResultView({
  character,
  testedAt,
}: {
  character: PersonalityCharacter;
  testedAt?: string;
}) {
  return (
    <article className="panel personality-result">
      <p className="eyebrow">PERSONALITY · THE BUTTERFLIES</p>
      <p className="personality-result-label">你的角色气质</p>
      <h2>{character.archetype} · {character.role}</h2>
      <p className="personality-one-liner">{character.oneLiner}</p>
      {testedAt && (
        <p className="muted personality-tested-at">
          最近测试：{new Intl.DateTimeFormat("zh-CN", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(testedAt))}
        </p>
      )}
      <div className="personality-copy">
        <section>
          <h3>Ta 的故事</h3>
          <p>{character.story}</p>
        </section>
        <section>
          <h3>你的气质</h3>
          <p>{character.vibe}</p>
          <h4>你在关系里的模式</h4>
          <p>{character.relationship}</p>
          <h4>你的人格底色</h4>
          <p>{character.general}</p>
        </section>
        <section>
          <h3>点题台词</h3>
          <ul>
            {character.quotes.map((quote) => <li key={quote}>{quote}</li>)}
          </ul>
        </section>
      </div>
      <Link className="btn secondary" href="/personality">
        再测一次
      </Link>
    </article>
  );
}
