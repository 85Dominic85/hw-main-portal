import type { TiptapDoc } from "@/lib/reports/schema";

type PmMark = { type: string; attrs?: Record<string, unknown> };
type PmNode = {
  type: string;
  content?: PmNode[];
  text?: string;
  marks?: PmMark[];
  attrs?: Record<string, unknown>;
};

function applyMarks(text: string, marks: PmMark[]): React.ReactNode {
  if (!marks.length) return text;
  const first = marks[0];
  if (!first) return text;
  const rest = marks.slice(1);
  const inner: React.ReactNode = rest.length > 0 ? applyMarks(text, rest) : text;
  if (first.type === "bold") return <strong>{inner}</strong>;
  if (first.type === "italic") return <em>{inner}</em>;
  if (first.type === "link") {
    const href = (first.attrs?.href as string) ?? "#";
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
        {inner}
      </a>
    );
  }
  return inner;
}

function renderNode(node: PmNode, key: string): React.ReactNode {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`));

    case "paragraph": {
      const children = (node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`));
      return <p key={key}>{children.length ? children : <br />}</p>;
    }

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const children = (node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`));
      if (level === 2) return <h2 key={key}>{children}</h2>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h4 key={key}>{children}</h4>;
    }

    case "text":
      return applyMarks(node.text ?? "", node.marks ?? []);

    case "hardBreak":
      return <br key={key} />;

    case "bulletList":
      return (
        <ul key={key}>
          {(node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key}>
          {(node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`))}
        </ol>
      );

    case "listItem":
      return (
        <li key={key}>
          {(node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`))}
        </li>
      );

    default:
      return (node.content ?? []).map((c, i) => renderNode(c, `${key}-${i}`));
  }
}

interface TiptapContentProps {
  doc: TiptapDoc;
  className?: string;
}

export function TiptapContent({ doc, className }: TiptapContentProps) {
  const nodes = (doc.content as PmNode[] | undefined) ?? [];
  if (!nodes.length) {
    return <p className="text-sm italic text-muted-foreground">Sin contenido.</p>;
  }

  return (
    <div className={className ?? "prose prose-sm max-w-none dark:prose-invert"}>
      {nodes.map((node, i) => renderNode(node, String(i)))}
    </div>
  );
}
