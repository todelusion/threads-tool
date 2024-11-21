import React, { useState, useCallback } from "react";
import { ImagePlus, Trash2, AlertCircle, Send, FileText } from "lucide-react";
import removeMd from "remove-markdown";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

function App() {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [isConverted, setIsConverted] = useState(false);
  const [originalContent, setOriginalContent] = useState("");

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (!isConverted) {
      setOriginalContent(newContent);
    }
    updatePreview(newContent);
  };

  const updatePreview = useCallback((text: string) => {
    if (!text) {
      setPreview([]);
      return;
    }

    const words = text.split(" ");
    const posts: string[] = [];
    let currentPost = "";

    words.forEach((word) => {
      if ((currentPost + " " + word).trim().length <= 500) {
        currentPost = (currentPost + " " + word).trim();
      } else {
        posts.push(currentPost);
        currentPost = word;
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

  const convertToThreads = useCallback(() => {
    setOriginalContent(content);

    const lines = content.split("\n");
    let currentThread = "";
    const threads: string[] = [];

    lines.forEach((line) => {
      const cleanLine = removeMd(line);

      if (!cleanLine.trim() && currentThread.trim()) {
        threads.push(currentThread.trim());
        currentThread = "";
        return;
      }

      if (!cleanLine.trim()) return;

      if (currentThread) {
        currentThread += "\n";
      }
      currentThread += cleanLine;

      if (currentThread.length > 450) {
        threads.push(currentThread.trim());
        currentThread = "";
      }
    });

    if (currentThread.trim()) {
      threads.push(currentThread.trim());
    }

    setContent(threads.join("\n\n"));
    updatePreview(threads.join("\n\n"));
    setIsConverted(true);
  }, [content]);

  const revertFromThreads = useCallback(() => {
    setContent(originalContent);
    updatePreview(originalContent);
    setIsConverted(false);
  }, [originalContent]);

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <div className="max-w-lg mx-auto px-4 pt-20 pb-4">
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start a thread..."
            className="w-full min-h-[120px] p-0 border-none focus:ring-0 resize-none text-[17px] 
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
              {!isConverted ? (
                <button
                  onClick={convertToThreads}
                  className="p-2 text-gray-400 hover:text-gray-200"
                  title="Convert to Threads"
                >
                  <FileText size={24} />
                </button>
              ) : (
                <button
                  onClick={revertFromThreads}
                  className="p-2 text-gray-400 hover:text-gray-200"
                  title="Revert from Threads"
                >
                  <FileText size={24} className="text-blue-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {content.length}/500
              </span>
              <button
                onClick={handlePost}
                disabled={!content && media.length === 0}
                className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="pt-4 space-y-4">
              {preview.map((post, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-800 rounded-lg text-[15px] text-white whitespace-pre-line"
                >
                  {post}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
