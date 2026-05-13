"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeRunner from "@/components/CodeRunner";

interface Props {
  content: string;
  highlightedBlocks: Record<number, string>; // index → highlighted HTML
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
          const isBlock = !!(props as { node?: { type?: string } }).node;
          const idx = blockIndex++;

          if (lang !== "text" && code.includes("\n")) {
            const highlighted = highlightedBlocks[idx];
            return (
              <div className="my-4 rounded-xl overflow-hidden">
                {highlighted ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: highlighted }} />
                    <CodeRunner initialCode={code} lang={lang} />
                  </>
                ) : (
                  <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                )}
              </div>
            );
          }

          return (
            <code
              className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-red-600 dark:text-red-400"
              {...props}
            >
              {children}
            </code>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-yellow-400 pl-4 my-4 text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/10 rounded-r-lg py-2 pr-4">
              {children}
            </blockquote>
          );
        },
        h2({ children }) {
          const id = String(children).toLowerCase().replace(/\s+/g, "-");
          return <h2 id={id} className="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">{children}</h3>;
        },
        a({ href, children }) {
          return (
            <a href={href} className="text-yellow-600 dark:text-yellow-400 hover:underline" target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {children}
            </a>
          );
        },
        img({ src, alt }) {
          return <img src={src} alt={alt ?? ""} className="my-4 max-w-full rounded-lg" />;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside space-y-1 my-3 pl-4">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside space-y-1 my-3 pl-4">{children}</ol>;
        },
        p({ children }) {
          return <p className="my-3 leading-7">{children}</p>;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return <th className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-left font-semibold border border-gray-200 dark:border-gray-700">{children}</th>;
        },
        td({ children }) {
          return <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
