import React, { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-graphql";
import * as htmlToImage from "html-to-image";
import { createRoot } from "react-dom/client";

interface CodeToImageProps {
  code: string;
  language: string;
}

export const CodeToImage: React.FC<CodeToImageProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current.querySelector("code") as Element);
    }
  }, [code, language]);

  const generateImage = async () => {
    if (codeRef.current) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        return await htmlToImage.toPng(codeRef.current, {
          backgroundColor: "#2d2d2d",
          style: {
            padding: "20px",
            borderRadius: "8px",
          },
          width: codeRef.current.offsetWidth,
          height: codeRef.current.offsetHeight,
        });
      } catch (error) {
        console.error("Error generating image:", error);
        return null;
      }
    }
    return null;
  };

  return (
    <div className="relative">
      <pre
        ref={codeRef}
        className="rounded-lg p-4 bg-[#2d2d2d] overflow-x-auto"
        style={{
          margin: 0,
          minWidth: "300px",
          maxWidth: "100%",
        }}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export const generateCodeImage = async (
  code: string,
  language: string
): Promise<string | null> => {
  const element = document.createElement("div");
  document.body.appendChild(element);

  const root = createRoot(element);
  root.render(<CodeToImage code={code} language={language} />);

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const codeElement = element.querySelector("pre");
    if (!codeElement) return null;

    const dataUrl = await htmlToImage.toPng(codeElement, {
      backgroundColor: "#2d2d2d",
      style: {
        padding: "20px",
        borderRadius: "8px",
      },
    });

    return dataUrl;
  } finally {
    root.unmount();
    document.body.removeChild(element);
  }
};
