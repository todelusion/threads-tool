import React, { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prism-themes/themes/prism-vsc-dark-plus.css";
import * as htmlToImage from "html-to-image";
import { Download, Copy } from "lucide-react";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-docker";
import { useToast } from "@/hooks/use-toast";

type SupportedLanguage = string;

const languageMap: Record<SupportedLanguage, string> = {
  typescript: "typescript",
  javascript: "javascript",
  jsx: "jsx",
  tsx: "tsx",
  bash: "bash",
  json: "json",
  markdown: "markdown",
  python: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  sql: "sql",
  yaml: "yaml",
  docker: "dockerfile",
  plaintext: "",
};

const loadLanguage = async (language: SupportedLanguage) => {
  if (language === "plaintext") return;
  return Promise.resolve();
};

interface CodeToImageProps {
  code: string;
  language: SupportedLanguage;
}

export const CodeToImage: React.FC<CodeToImageProps> = ({ code, language }) => {
  const { toast } = useToast();
  const codeRef = useRef<HTMLPreElement>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const highlight = async () => {
      await loadLanguage(language);

      if (codeRef.current) {
        const codeElement = codeRef.current.querySelector("code");
        if (codeElement) {
          codeElement.className = `language-${language}`;
          Prism.highlightElement(codeElement);
        }
      }
      generateFullImage();
    };

    highlight();
  }, [code, language]);

  const generateFullImage = async () => {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    document.body.appendChild(tempDiv);

    const pre = document.createElement("pre");
    pre.className = "rounded-lg p-4 bg-[#1e1e1e]";
    pre.style.margin = "0";
    pre.style.minWidth = "590px";
    pre.style.maxHeight = "none";
    pre.style.overflow = "visible";
    pre.style.whiteSpace = "pre";

    const codeElement = document.createElement("code");
    codeElement.className = `language-${language}`;
    codeElement.textContent = code;

    pre.appendChild(codeElement);
    tempDiv.appendChild(pre);

    try {
      Prism.highlightElement(codeElement);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const actualWidth = pre.scrollWidth + 40;

      const dataUrl = await htmlToImage.toPng(pre, {
        backgroundColor: "#1e1e1e",
        style: {
          padding: "20px",
          borderRadius: "8px",
        },
        width: actualWidth,
        pixelRatio: 2,
        quality: 1.0,
      });
      setFullImageUrl(dataUrl);
    } catch (error) {
      console.error("Error generating full image:", error);
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleDownload = () => {
    if (fullImageUrl) {
      const link = document.createElement("a");
      link.href = fullImageUrl;
      link.download = `code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Image downloaded",
        description: "The code image has been downloaded successfully",
      });
    }
  };

  const handleCopyImage = async () => {
    if (fullImageUrl) {
      try {
        const response = await fetch(fullImageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        toast({
          title: "Image copied",
          description: "The code image has been copied to your clipboard",
        });
      } catch (error) {
        console.error("Error copying image:", error);
        toast({
          title: "Failed to copy image",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="relative group">
      <div className="max-h-[314px] overflow-auto rounded-lg">
        <pre
          ref={codeRef}
          className="rounded-lg p-4 bg-[#1e1e1e]"
          style={{ margin: 0, width: "100%" }}
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={handleCopyImage}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer z-10"
          title="Copy image"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer z-10"
          title="Download full image"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
};

export const generateCodeImage = async (
  code: string,
  language: SupportedLanguage
): Promise<string | null> => {
  await loadLanguage(language);

  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  document.body.appendChild(tempDiv);

  const pre = document.createElement("pre");
  pre.className = "rounded-lg p-4 bg-[#2d2d2d]";
  pre.style.margin = "0";
  pre.style.minWidth = "590px";
  pre.style.whiteSpace = "pre";

  const codeElement = document.createElement("code");
  codeElement.className = `language-${language}`;
  codeElement.textContent = code;

  pre.appendChild(codeElement);
  tempDiv.appendChild(pre);

  try {
    Prism.highlightElement(codeElement);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const actualWidth = pre.scrollWidth + 40;

    const dataUrl = await htmlToImage.toPng(pre, {
      backgroundColor: "#1e1e1e",
      style: {
        padding: "20px",
        borderRadius: "8px",
      },
      width: actualWidth,
      pixelRatio: 2,
      quality: 1.0,
    });

    return dataUrl;
  } finally {
    document.body.removeChild(tempDiv);
  }
};
