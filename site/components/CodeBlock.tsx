import { codeToHtml } from "shiki";

interface Props {
  code: string;
  lang?: string;
}

export default async function CodeBlock({ code, lang = "javascript" }: Props) {
  const html = await codeToHtml(code, {
    lang: lang === "js" ? "javascript" : lang,
    theme: "github-dark",
  });

  return (
    <div
      className="relative group my-4 rounded-xl overflow-hidden text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
