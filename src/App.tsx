import React, { useState, useCallback } from "react";
import { ImagePlus, Trash2, AlertCircle, Send, FileText } from "lucide-react";
import removeMd from "remove-markdown";
import { marked, Tokens } from "marked";
import { CodeToImage, generateCodeImage } from "./CodeToImage";
import * as htmlToImage from "html-to-image";
import { createRoot } from "react-dom/client";

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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [originalContent, setOriginalContent] = useState("");
  const [codeBlockImages, setCodeBlockImages] = useState<CodeBlockImage[]>([]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setOriginalContent(newContent);
    processContentWithCodeBlocks(newContent);
  };

  const processContentWithCodeBlocks = useCallback(async (text: string) => {
    const tokens = marked.lexer(text);
    let processedContent = text;
    const newCodeBlockImages: CodeBlockImage[] = [];

    for (const token of tokens) {
      if (token.type === "code") {
        const codeBlock = token as Tokens.Code;
        const id = Math.random().toString(36).substring(7);

        const imageUrl = await generateCodeImage(
          codeBlock.text,
          codeBlock.lang || "plaintext"
        );

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

  const handleMediaAdd = () => {
    if (media.length >= 10) return;

    // Simulate adding a random Unsplash image
    const randomId = Math.floor(Math.random() * 1000);
    const newMedia: MediaItem = {
      id: randomId.toString(),
      url: `https://source.unsplash.com/random/800x600?sig=${randomId}`,
      type: "image",
    };

    setMedia([...media, newMedia]);
  };

  const removeMedia = (id: string) => {
    setMedia(media.filter((item) => item.id !== id));
  };

  const handlePost = () => {
    alert("Posts ready to be shared! (Simulation)");
    setContent("");
    setMedia([]);
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

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-4">
        <div className="grid grid-cols-2 gap-8">
          {/* 左側輸入區 */}
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Start a thread..."
              className="w-full min-h-[calc(100vh-200px)] p-4 border border-gray-800 rounded-lg focus:ring-0 text-[17px] 
              bg-transparent text-white placeholder:text-gray-400"
            />

            {/* Media Grid */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {media.map((item) => (
                  <div key={item.id} className="relative aspect-square group">
                    <img
                      src={item.url}
                      alt="Media preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMediaAdd}
                  disabled={media.length >= 10}
                  className="p-2 text-gray-400 hover:text-gray-200 disabled:opacity-50"
                >
                  <ImagePlus size={24} />
                </button>
                <button
                  onClick={handlePost}
                  disabled={!content && media.length === 0}
                  className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium disabled:opacity-50"
                >
                  Post
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {content.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* 右側預覽區 */}
          <div className="space-y-4">
            {preview.map((post, index) => (
              <div
                key={index}
                className="p-4 border border-gray-800 rounded-lg text-[15px] text-white whitespace-pre-line"
              >
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
