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
    if (codeRef.current) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const dataUrl = await htmlToImage.toPng(codeRef.current, {
          backgroundColor: "#2d2d2d",
          style: {
            padding: "20px",
            borderRadius: "8px",
          },
        });
        setFullImageUrl(dataUrl);
      } catch (error) {
        console.error("Error generating full image:", error);
      }
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
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 p-2 bg-gray-800/80 hover:bg-gray-700 
                 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                 text-white cursor-pointer"
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
  const element = document.createElement("div");
  element.style.width = "590px";
  document.body.appendChild(element);

  const root = createRoot(element);
  root.render(<CodeToImage code={code} language={language} />);

  try {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const codeElement = element.querySelector("pre");
    if (!codeElement) return null;

    const actualHeight = Math.min(codeElement.offsetHeight, 314);

    // 預覽圖片使用固定高度
    const dataUrl = await htmlToImage.toPng(codeElement, {
      backgroundColor: "#2d2d2d",
      style: {
        padding: "20px",
        borderRadius: "8px",
      },
      width: 590,
      height: actualHeight,
    });

    return dataUrl;
  } finally {
    root.unmount();
    document.body.removeChild(element);
  }
};
