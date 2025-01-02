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
import { Toaster } from "./components/ui/toaster";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface TableImage {
  id: string;
  imageUrl: string;
  originalTable: string;
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
  const [tableImages, setTableImages] = useState<TableImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    if (!text.includes("```") && !text.includes("|")) {
      updatePreview(
        removeMd(text, {
          listUnicodeChar: "-",
          stripListLeaders: false,
          useImgAltText: true,
        })
      );
      return;
    }

    const tokens = marked.lexer(text);
    let processedContent = text;
    const newCodeBlockImages: CodeBlockImage[] = [];
    const newTableImages: TableImage[] = [];

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

    const tablePromises = tokens
      .filter((token): token is Tokens.Table => token.type === "table")
      .map(async (table) => {
        const id = Math.random().toString(36).substring(7);

        const processCellContent = (cell: any): string => {
          if (cell === null || cell === undefined || cell === "") return "";
          if (typeof cell === "object") {
            if (cell.text !== undefined) return cell.text;
            if (cell.tokens && cell.tokens.length > 0) {
              return cell.tokens.map((t: any) => t.text || "").join("");
            }
            return "";
          }
          return String(cell);
        };

        const headerCells = table.header.map(processCellContent);
        const bodyRows = table.rows.map((row) => row.map(processCellContent));

        const tableHtml = `
          <div style="padding: 1rem; background: #1e1e1e; border-radius: 8px; color: white;">
            <table style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr>
                  ${headerCells
                    .map(
                      (cell) =>
                        `<th style="border: 1px solid #404040; padding: 8px; text-align: left;">${
                          cell || ""
                        }</th>`
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${bodyRows
                  .map(
                    (row) =>
                      `<tr>${row
                        .map(
                          (cell) =>
                            `<td style="border: 1px solid #404040; padding: 8px;">${
                              cell || ""
                            }</td>`
                        )
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = tableHtml;
        document.body.appendChild(tempDiv);

        const imageUrl = await htmlToImage.toPng(tempDiv);
        document.body.removeChild(tempDiv);

        return { table, id, imageUrl };
      });

    const [codeResults, tableResults] = await Promise.all([
      Promise.all(codeBlockPromises),
      Promise.all(tablePromises),
    ]);

    for (const { codeBlock, id, imageUrl } of codeResults) {
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

    for (const { table, id, imageUrl } of tableResults) {
      if (imageUrl) {
        newTableImages.push({
          id,
          imageUrl,
          originalTable: table.raw,
        });

        const tableRegex = new RegExp(escapeRegExp(table.raw), "g");
        processedContent = processedContent.replace(
          tableRegex,
          `[Table Image ${id}]`
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
          listUnicodeChar: "-",
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

    setTableImages(newTableImages);
    setCodeBlockImages(newCodeBlockImages);
    updatePreview(plainText);
  }, []);

  const updatePreview = useCallback((text: string) => {
    if (!text) {
      setPreview([]);
      return;
    }

    const posts: string[] = [];
    let currentPost = "";

    // Split by code block markers to handle them separately
    const segments = text.split(/(```[\s\S]*?```)/);

    segments.forEach((segment, index) => {
      // If this is a code block, add it to current post
      if (segment.startsWith("```")) {
        currentPost = currentPost ? currentPost + "\n" + segment : segment;
        return;
      }

      // Process non-code-block text
      const parts = segment.split(/\n§§§\n/);
      parts.forEach((part, partIndex) => {
        // For first part, append to current post
        if (partIndex === 0) {
          currentPost = currentPost ? currentPost + "\n" + part : part;
        } else {
          // For subsequent parts after §§§, create new posts
          if (currentPost) {
            posts.push(currentPost.trim());
          }
          currentPost = part;
        }
      });
    });

    // Add the last post if exists
    if (currentPost) {
      posts.push(currentPost.trim());
    }

    // Handle length limits after splitting by §§§
    const finalPosts: string[] = [];
    posts.forEach((post) => {
      if (post.length <= 500) {
        finalPosts.push(post);
      } else {
        // Split long posts by length
        const lines = post.split("\n");
        let tempPost = "";
        lines.forEach((line) => {
          if ((tempPost + "\n" + line).length > 500) {
            if (tempPost) finalPosts.push(tempPost.trim());
            tempPost = line;
          } else {
            tempPost = tempPost ? tempPost + "\n" + line : line;
          }
        });
        if (tempPost) finalPosts.push(tempPost.trim());
      }
    });

    setPreview(finalPosts);
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
    const parts = post.split(/(\[(?:Code|Table) Image [^\]]+\])/);

    return parts.map((part, index) => {
      const codeMatch = part.match(/\[Code Image ([^\]]+)\]/);
      const tableMatch = part.match(/\[Table Image ([^\]]+)\]/);

      if (codeMatch) {
        const imageId = codeMatch[1];
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
      } else if (tableMatch) {
        const imageId = tableMatch[1];
        const tableImage = tableImages.find((img) => img.id === imageId);
        if (tableImage) {
          return (
            <img
              key={index}
              src={tableImage.imageUrl}
              alt="Table"
              className="max-w-full rounded-lg my-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(tableImage.imageUrl)}
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
      // 檢查是否為平板或手機版 (< 1024px)
      const isMobileOrTablet = window.innerWidth < 1024; // 使用 lg breakpoint

      const textarea = e.target as HTMLTextAreaElement;
      const cursorPos = textarea.selectionStart;
      setCursorPosition(cursorPos);

      // 如果是平板或手機版，就不執行滾動功能
      if (isMobileOrTablet) return;

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

  const Modal = ({
    imageUrl,
    onClose,
  }: {
    imageUrl: string;
    onClose: () => void;
  }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            ×
          </button>
          <img
            src={imageUrl}
            alt="Table Preview"
            className="rounded-lg max-w-full max-h-[90vh] object-contain"
          />
        </div>
      </div>
    );
  };

  const insertPageBreak = () => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + "\n§§§\n" + content.substring(end);

    setContent(newContent);

    // Move cursor after the page break
    setTimeout(() => {
      textarea.selectionStart = start + 5;
      textarea.selectionEnd = start + 5;
      textarea.focus();
    }, 0);

    debouncedProcessContent(newContent);
  };

  return (
    <>
      <div className="min-h-screen bg-[#101010] text-white">
        <div className="max-w-6xl mx-auto pt-4 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:sticky md:top-20 h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]">
              <div className="space-y-4 h-full flex flex-col">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  onSelect={handleCursorChange}
                  placeholder="Start a thread..."
                  className="flex-1 w-full p-4 border border-gray-800 rounded-lg focus:ring-0 text-[15px] resize-none 
                bg-transparent text-white placeholder:text-gray-400"
                />

                <div className="flex items-center justify-between pt-2 border-t border-gray-800 pb-4 md:pb-10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={insertPageBreak}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                      title="Insert page break"
                    >
                      <FileText size={20} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {content.length}/500
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div ref={previewRef} className="space-y-4 pb-20 md:pb-0">
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
        {selectedImage && (
          <Modal
            imageUrl={selectedImage}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </div>
      <Toaster />
    </>
  );
}

export default App;
