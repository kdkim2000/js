"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeRunner from "@/components/CodeRunner";

interface Props {
  content: string;
  highlightedBlocks: Record<number, string>;
}

let blockIndex = 0;

export default function ArticleContent({ content, highlightedBlocks }: Props) {
  blockIndex = 0;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1] ?? "text";
          const code = String(children).replace(/\n$/, "");
          const idx = blockIndex++;

          if (lang !== "text" && code.includes("\n")) {
            const highlighted = highlightedBlocks[idx];
            return (
              <div className="my-6 rounded-[10px] overflow-hidden">
                {highlighted ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: highlighted }} />
                    <CodeRunner initialCode={code} lang={lang} />
                  </>
                ) : (
                  <pre className="bg-gray-900 text-gray-50 px-5 py-[18px] text-[0.875rem] overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                )}
              </div>
            );
          }

          return (
            <code
              className="px-1.5 py-0.5 rounded bg-gray-100 text-[0.86em] font-mono text-purple-700"
              {...props}
            >
              {children}
            </code>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-[3px] border-purple-300 bg-purple-25 rounded-r-lg pl-4 pr-4 py-3 my-5 text-[16px] leading-[26px] text-gray-700">
              {children}
            </blockquote>
          );
        },
        h2({ children }) {
          const id = String(children).toLowerCase().replace(/\s+/g, "-");
          return (
            <h2 id={id} className="text-[22px] font-bold leading-[30px] text-gray-900 mt-11 mb-3.5">
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className="text-[17px] font-bold leading-[24px] text-gray-900 mt-8 mb-2.5">
              {children}
            </h3>
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              className="text-purple-700 hover:underline"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              {children}
            </a>
          );
        },
        img({ src, alt }) {
          return <img src={src} alt={alt ?? ""} className="my-5 max-w-full rounded-lg" />;
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 space-y-1 my-4 text-gray-400 marker:text-gray-400">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 space-y-1 my-4">{children}</ol>;
        },
        li({ children }) {
          return <li className="text-gray-800 leading-[30px]">{children}</li>;
        },
        p({ children }) {
          return <p className="my-4 leading-[30px] text-gray-800" style={{ textWrap: 'pretty' } as React.CSSProperties}>{children}</p>;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-5">
              <table className="w-full text-sm border-collapse border border-gray-200">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return <th className="px-3 py-2 bg-gray-50 text-left font-semibold border border-gray-200 text-gray-700">{children}</th>;
        },
        td({ children }) {
          return <td className="px-3 py-2 border border-gray-200 text-gray-700">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
