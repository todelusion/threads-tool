import React, { useState, useCallback } from "react";
import {
  ImagePlus,
  Trash2,
  AlertCircle,
  Send,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import removeMd from "remove-markdown";
import { marked, Tokens } from "marked";
import { CodeToImage, generateCodeImage } from "./CodeToImage";
import * as htmlToImage from "html-to-image";
import { createRoot } from "react-dom/client";
import { debounce, throttle } from "lodash";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface CodeBlockImage {
  id: string;
  imageUrl: string;
  originalCode: string;
  language: string;
}

type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "jsx"
  | "tsx"
  | "bash"
  | "json"
  | "markdown"
  | "python"
  | "java"
  | "c"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "sql"
  | "yaml"
  | "docker"
  | "plaintext";

function App() {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<string[]>([]);
  const [originalContent, setOriginalContent] = useState("");
  const [codeBlockImages, setCodeBlockImages] = useState<CodeBlockImage[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const debouncedProcessContent = useCallback(
    debounce(async (text: string) => {
      processContentWithCodeBlocks(text);
    }, 500),
    []
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setOriginalContent(newContent);
    debouncedProcessContent(newContent);
  };

  const processContentWithCodeBlocks = useCallback(async (text: string) => {
    if (!text.includes("```")) {
      updatePreview(removeMd(text));
      return;
    }

    const tokens = marked.lexer(text);
    let processedContent = text;
    const newCodeBlockImages: CodeBlockImage[] = [];

    const codeBlockPromises = tokens
      .filter((token): token is Tokens.Code => token.type === "code")
      .map(async (codeBlock) => {
        const id = Math.random().toString(36).substring(7);
        const imageUrl = await generateCodeImage(
          codeBlock.text,
          codeBlock.lang || "plaintext"
        );

        return { codeBlock, id, imageUrl };
      });

    const results = await Promise.all(codeBlockPromises);

    for (const { codeBlock, id, imageUrl } of results) {
      if (imageUrl) {
        newCodeBlockImages.push({
          id,
          imageUrl,
          originalCode: codeBlock.text,
          language: codeBlock.lang || "plaintext",
        });

        const codeBlockRegex = new RegExp(
          "```" +
            (codeBlock.lang || "") +
            "\\n" +
            escapeRegExp(codeBlock.text) +
            "\\n```",
          "g"
        );
        processedContent = processedContent.replace(
          codeBlockRegex,
          `[Code Image ${id}]`
        );
      }
    }

    let plainText = processedContent
      .split(/(\[Code Image [^\]]+\])/)
      .map((part) => {
        if (part.startsWith("[Code Image")) {
          return part;
        }
        return removeMd(part, {
          stripListLeaders: false,
          listUnicodeChar: "",
          gfm: true,
          useImgAltText: false,
        });
      })
      .join("");

    plainText = plainText
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    setCodeBlockImages(newCodeBlockImages);
    updatePreview(plainText);
  }, []);

  const updatePreview = useCallback((text: string) => {
    if (!text) {
      setPreview([]);
      return;
    }

    const posts: string[] = [];
    const lines = text.split("\n");
    let currentPost = "";

    lines.forEach((line) => {
      if (currentPost && (currentPost + "\n" + line).length > 500) {
        posts.push(currentPost);
        currentPost = line;
      } else {
        currentPost = currentPost ? currentPost + "\n" + line : line;
      }
    });

    if (currentPost) {
      posts.push(currentPost);
    }

    setPreview(posts);
  }, []);

  const handlePost = () => {
    alert("Posts ready to be shared! (Simulation)");
    setContent("");
    setPreview([]);
  };

  const parseCodeBlocks = (content: string) => {
    const tokens = marked.lexer(content);
    const codeBlocks = tokens.filter(
      (token) => token.type === "code"
    ) as Tokens.Code[];

    return codeBlocks.map((block) => ({
      code: block.text,
      language: (block.lang || "plaintext") as SupportedLanguage,
    }));
  };

  const codeBlocks = parseCodeBlocks(content);

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const renderPreviewContent = (post: string) => {
    const parts = post.split(/(\[Code Image [^\]]+\])/);

    return parts.map((part, index) => {
      const match = part.match(/\[Code Image ([^\]]+)\]/);
      if (match) {
        const imageId = match[1];
        const codeImage = codeBlockImages.find((img) => img.id === imageId);
        if (codeImage) {
          const tokens = marked.lexer(originalContent);
          const codeBlock = tokens.find(
            (token) =>
              token.type === "code" && token.text === codeImage.originalCode
          ) as Tokens.Code;

          return (
            <CodeToImage
              key={index}
              code={codeImage.originalCode}
              language={codeBlock?.lang || "plaintext"}
            />
          );
        }
      }
      return (
        <span key={index} style={{ whiteSpace: "pre-wrap" }}>
          {part}
        </span>
      );
    });
  };

  const processTextForLength = useCallback((text: string) => {
    let processed = text.replace(/```[\s\S]*?```/g, "[code]");
    processed = removeMd(processed);
    processed = processed
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
    return processed;
  }, []);

  const handleCursorChange = useCallback(
    throttle((e: any) => {
      const textarea = e.target as HTMLTextAreaElement;
      const cursorPos = textarea.selectionStart;
      setCursorPosition(cursorPos);

      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const processedTextBeforeCursor = processTextForLength(textBeforeCursor);

      let accumulatedLength = 0;
      const blockIndex = preview.findIndex((block) => {
        const processedBlockLength = processTextForLength(block).length;
        const result =
          processedTextBeforeCursor.length >= accumulatedLength &&
          processedTextBeforeCursor.length <=
            accumulatedLength + processedBlockLength;
        accumulatedLength += processedBlockLength + 1;
        return result;
      });

      if (blockIndex !== -1 && previewRef.current) {
        const previewBlocks =
          previewRef.current.querySelectorAll(".preview-block");
        if (previewBlocks[blockIndex]) {
          previewBlocks[blockIndex].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, 100),
    [preview, processTextForLength]
  );

  const isActiveBlock = useCallback(
    (index: number) => {
      let accumulatedLength = 0;
      const processedCursorPosition = processTextForLength(
        content.substring(0, cursorPosition)
      ).length;

      for (let i = 0; i < preview.length; i++) {
        const processedPost = processTextForLength(preview[i]);
        const blockStart = accumulatedLength;
        const blockEnd = blockStart + processedPost.length;

        if (i === index) {
          return (
            processedCursorPosition >= blockStart &&
            processedCursorPosition <= blockEnd
          );
        }

        accumulatedLength += processedPost.length + 1;
      }
      return false;
    },
    [content, cursorPosition, preview, processTextForLength]
  );

  const copyPostContent = useCallback((post: string, index: number) => {
    const textContent = post
      .split(/(\[Code Image [^\]]+\])/)
      .filter((part) => !part.startsWith("[Code Image"))
      .join("")
      .trim();

    navigator.clipboard.writeText(textContent).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-4">
        <div className="grid grid-cols-2 gap-8">
          <div className="sticky top-20 h-[calc(100vh-80px)]">
            <div className="space-y-4 h-full flex flex-col">
              <textarea
                value={content}
                onChange={handleContentChange}
                onSelect={handleCursorChange}
                placeholder="Start a thread..."
                className="flex-1 w-full p-4 border border-gray-800 rounded-lg focus:ring-0 text-[15px] 
                bg-transparent text-white placeholder:text-gray-400"
              />

              <div className="flex items-center justify-end pt-2 border-t border-gray-800 pb-10">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {content.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div ref={previewRef} className="space-y-4">
            {preview.map((post, index) => (
              <div
                key={index}
                className={`preview-block relative p-4 border border-gray-800 rounded-lg text-[15px] text-white whitespace-pre-line
                  ${
                    isActiveBlock(index) ? "bg-yellow-500/20" : ""
                  } transition-colors duration-200`}
              >
                <button
                  onClick={() => copyPostContent(post, index)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy text"
                >
                  {copiedIndex === index ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
                {renderPreviewContent(post)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
