import * as React from "react";

import type { TiptapDoc } from "@/lib/reports/schema";
import { cn } from "@/lib/utils/cn";

/**
 * Renderizador de solo-lectura para documentos TipTap.
 *
 * ── Por qué no reusar `TiptapEditor` con `readOnly` ─────────────────────
 * Ese componente monta una instancia de ProseMirror por cada uso. En la
 * bitácora se pintan decenas de entradas a la vez (el diario de una semana, o
 * los últimos 200 registros), así que montar un editor por entrada carga el
 * bundle y el runtime sin ninguna ganancia: nadie va a editar ahí.
 *
 * Esto recorre el mismo árbol y emite HTML plano, conservando el formato que
 * se escribió (negrita, cursiva, listas, enlaces, encabezados). Sin
 * dependencias y renderizable en servidor.
 *
 * Cubre los nodos que produce el editor del portal (StarterKit con headings
 * 2-3 + Link); cualquier nodo desconocido se degrada a su texto.
 */

interface PmMark {
  type: string;
  attrs?: Record<string, unknown> | undefined;
}

interface PmNode {
  type: string;
  text?: string | undefined;
  marks?: PmMark[] | undefined;
  attrs?: Record<string, unknown> | undefined;
  content?: PmNode[] | undefined;
}

export function RichText({
  doc,
  className,
}: {
  doc: TiptapDoc | null | undefined;
  className?: string;
}) {
  const nodes = (doc?.content ?? []) as PmNode[];
  if (nodes.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-1.5 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
    >
      {nodes.map((node, i) => (
        <Block key={i} node={node} />
      ))}
    </div>
  );
}

function Block({ node }: { node: PmNode }) {
  switch (node.type) {
    case "paragraph": {
      const inline = <Inline nodes={node.content ?? []} />;
      // Un párrafo vacío en TipTap es un salto de línea deliberado.
      if (!node.content?.length) return null;
      return <p>{inline}</p>;
    }

    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2;
      const Tag = (level === 3 ? "h5" : "h4") as "h4" | "h5";
      return (
        <Tag className="font-semibold text-foreground">
          <Inline nodes={node.content ?? []} />
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul className="list-disc space-y-0.5 pl-5">
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              <ListItemContent node={li} />
            </li>
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal space-y-0.5 pl-5">
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              <ListItemContent node={li} />
            </li>
          ))}
        </ol>
      );

    case "blockquote":
      return (
        <blockquote className="border-l-2 border-border pl-3 italic">
          {(node.content ?? []).map((child, i) => (
            <Block key={i} node={child} />
          ))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre className="overflow-x-auto rounded bg-secondary/60 p-2 font-mono text-xs">
          <code>
            <Inline nodes={node.content ?? []} />
          </code>
        </pre>
      );

    case "horizontalRule":
      return <hr className="border-border" />;

    default:
      // Nodo desconocido: no se pierde el texto que lleve dentro.
      return (
        <p>
          <Inline nodes={node.content ?? []} />
        </p>
      );
  }
}

/** El contenido de un listItem son párrafos; aquí se aplanan para no anidar <p>. */
function ListItemContent({ node }: { node: PmNode }) {
  const children = node.content ?? [];
  const allParagraphs = children.every((c) => c.type === "paragraph");
  if (allParagraphs) {
    return (
      <>
        {children.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && " "}
            <Inline nodes={c.content ?? []} />
          </React.Fragment>
        ))}
      </>
    );
  }
  return (
    <>
      {children.map((c, i) => (
        <Block key={i} node={c} />
      ))}
    </>
  );
}

function Inline({ nodes }: { nodes: PmNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === "hardBreak") return <br key={i} />;

        if (node.type === "text") {
          return <Marked key={i} node={node} />;
        }

        // Nodo inline desconocido con hijos.
        return <Inline key={i} nodes={node.content ?? []} />;
      })}
    </>
  );
}

/** Aplica las marcas de un text node. Los enlaces no abren en la misma pestaña. */
function Marked({ node }: { node: PmNode }) {
  let element: React.ReactNode = node.text ?? "";
  const marks = node.marks ?? [];

  if (marks.some((m) => m.type === "code")) {
    element = <code className="rounded bg-secondary/60 px-1 font-mono text-xs">{element}</code>;
  }
  if (marks.some((m) => m.type === "bold")) {
    element = <strong className="font-semibold text-foreground">{element}</strong>;
  }
  if (marks.some((m) => m.type === "italic")) {
    element = <em>{element}</em>;
  }
  if (marks.some((m) => m.type === "strike")) {
    element = <s>{element}</s>;
  }

  const link = marks.find((m) => m.type === "link");
  const href = typeof link?.attrs?.href === "string" ? link.attrs.href : null;
  // Solo http(s): un href javascript: en el JSON no debe llegar al DOM.
  if (href && /^https?:\/\//i.test(href)) {
    element = (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {element}
      </a>
    );
  }

  return <>{element}</>;
}
