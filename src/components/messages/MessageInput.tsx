import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Send, Code, Image, FileText } from "lucide-react";
import { FileUpload } from "./FileUpload";

interface MessageInputProps {
  onSend?: (content: string, type: 'text' | 'code') => void;
  onUploadFile?: (file: File) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ onSend, onUploadFile, placeholder = "Type a message...", disabled }: MessageInputProps) {
  const [content, setContent] = React.useState("");
  const [isCode, setIsCode] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (content.trim() && onSend) {
      onSend(content, isCode ? 'code' : 'text');
      setContent("");
      setIsCode(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    if (onUploadFile) {
      try {
        setUploadProgress(0);
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null || prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 200);

        await onUploadFile(file);
        clearInterval(interval);
        setUploadProgress(100);
        
        // Clear the file after a brief delay to show completion
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(null);
        }, 500);
      } catch (error) {
        console.error('File upload failed:', error);
        setSelectedFile(null);
        setUploadProgress(null);
      }
    }
  };

  const handleFileClick = () => {
    // Create a file input if it doesn't exist
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFileSelect(file);
      };
      fileInputRef.current = input;
      document.body.appendChild(input);
    }
    fileInputRef.current.click();
  };

  React.useEffect(() => {
    // Cleanup file input on unmount
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {selectedFile && (
        <FileUpload
          selectedFile={selectedFile}
          progress={uploadProgress ?? undefined}
          onFileSelect={handleFileSelect}
          onCancel={() => {
            setSelectedFile(null);
            setUploadProgress(null);
          }}
          className="mb-2"
        />
      )}
      
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="w-8 h-8" disabled={disabled}>
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="grid gap-1">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => setIsCode(!isCode)}
                disabled={disabled}
              >
                <Code className="mr-2 h-4 w-4" />
                {isCode ? "Switch to Text" : "Code Block"}
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={handleFileClick}
                disabled={disabled}
              >
                <Image className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start"
                onClick={handleFileClick}
                disabled={disabled}
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={
              "min-h-[80px] w-full resize-none bg-background " +
              (isCode ? "font-mono" : "")
            }
          />
        </div>

        <Button 
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          size="icon"
          className="h-8 w-8"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Format hint */}
      <div className="flex gap-4 text-xs ml-10 text-muted-foreground">
        <span>Press Enter to send</span>
        <span>Shift + Enter for new line</span>
        {isCode && <span>Code formatting enabled</span>}
      </div>
    </div>
  );
} 