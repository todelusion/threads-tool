import React, { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-graphql";
import * as htmlToImage from "html-to-image";
import { createRoot } from "react-dom/client";
import { Download } from "lucide-react"; // 假設你使用 lucide-react 圖標

interface CodeToImageProps {
  code: string;
  language: string;
}

export const CodeToImage: React.FC<CodeToImageProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLPreElement>(null);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current.querySelector("code") as Element);
      generateFullImage();
    }
  }, [code, language]);

  const generateFullImage = async () => {
    // 創建一個臨時的完整程式碼區塊（無高度限制）
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    document.body.appendChild(tempDiv);

    const pre = document.createElement("pre");
    pre.className = "rounded-lg p-4 bg-[#2d2d2d]";
    pre.style.margin = "0";
    pre.style.width = "590px";
    // 移除任何高度限制
    pre.style.maxHeight = "none";
    pre.style.overflow = "visible";

    const codeElement = document.createElement("code");
    codeElement.className = `language-${language}`;
    codeElement.textContent = code;

    pre.appendChild(codeElement);
    tempDiv.appendChild(pre);

    try {
      Prism.highlightElement(codeElement);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(pre, {
        backgroundColor: "#2d2d2d",
        style: {
          padding: "20px",
          borderRadius: "8px",
        },
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
    }
  };

  return (
    <div className="relative group">
      <div className="max-h-[314px] overflow-auto rounded-lg">
        <pre
          ref={codeRef}
          className="rounded-lg p-4 bg-[#2d2d2d]"
          style={{
            margin: 0,
            width: "100%",
          }}
        >
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 p-2 bg-gray-800/80 hover:bg-gray-700 
                 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                 text-white cursor-pointer z-10"
        title="Download full image"
      >
        <Download size={16} />
      </button>
    </div>
  );
};

export const generateCodeImage = async (
  code: string,
  language: string
): Promise<string | null> => {
  // 創建臨時元素（無滾動條）
  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "-9999px";
  document.body.appendChild(tempDiv);

  const pre = document.createElement("pre");
  pre.className = "rounded-lg p-4 bg-[#2d2d2d]";
  pre.style.margin = "0";
  pre.style.width = "590px";

  const codeElement = document.createElement("code");
  codeElement.className = `language-${language}`;
  codeElement.textContent = code;

  pre.appendChild(codeElement);
  tempDiv.appendChild(pre);

  try {
    Prism.highlightElement(codeElement);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const dataUrl = await htmlToImage.toPng(pre, {
      backgroundColor: "#2d2d2d",
      style: {
        padding: "20px",
        borderRadius: "8px",
      },
      width: 590,
    });

    return dataUrl;
  } finally {
    document.body.removeChild(tempDiv);
  }
};
