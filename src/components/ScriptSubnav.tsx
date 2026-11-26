import Link from "next/link";

const ITEMS = [
  { href: "/script/world", label: "世界观" },
  { href: "/characters", label: "人物小传" },
  { href: "/lyrics", label: "歌词" },
] as const;

export function ScriptSubnav() {
  return (
    <nav className="subnav-row" aria-label="剧情导航">
      {ITEMS.map((item) => (
        <Link href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
