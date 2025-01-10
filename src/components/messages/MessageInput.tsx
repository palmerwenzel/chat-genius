import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Send, Code, Image, FileText, Reply, X } from "lucide-react";
import { FileUpload } from "./FileUpload";

interface MessageInputProps {
  onSend?: (content: string, type: 'text' | 'code', replyTo?: { id: string; content: string; author: string }) => void;
  onUploadFile?: (file: File) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  onCancelReply?: () => void;
  onNavigateToMessage?: (messageId: string) => void;
  initialContent?: string;
  initialType?: 'text' | 'code';
  onCancel?: () => void;
}

export const MessageInput = React.forwardRef<{ focus: () => void }, MessageInputProps>(({ 
  onSend, 
  onUploadFile, 
  placeholder = "Type a message...", 
  disabled,
  replyTo,
  onCancelReply,
  onNavigateToMessage,
  initialContent = '',
  initialType = 'text',
  onCancel
}, ref) => {
  const [content, setContent] = React.useState(initialContent);
  const [isCode, setIsCode] = React.useState(initialType === 'code');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update content when initialContent changes
  React.useEffect(() => {
    setContent(initialContent);
    setIsCode(initialType === 'code');
  }, [initialContent, initialType]);

  // Expose focus method
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }), []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (replyTo && onCancelReply) {
        onCancelReply();
      } else if (onCancel) {
        onCancel();
      } else {
        textareaRef.current?.blur();
      }
    }
  };

  const handleSend = () => {
    if (content.trim() && onSend) {
      onSend(content, isCode ? 'code' : 'text', replyTo);
      setContent("");
      setIsCode(false);
      if (onCancelReply) onCancelReply();
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
      {replyTo && (
        <div className="flex items-center gap-2 -mt-1.5 px-3 py-1.5 bg-muted/50 rounded text-sm">
          <Reply className="h-3 w-3 text-muted-foreground rotate-180" />
          <button 
            onClick={() => onNavigateToMessage?.(replyTo.id)}
            className="flex-1 text-left hover:underline"
          >
            <span className="text-muted-foreground">Replying to <span className="text-foreground">{replyTo.author}</span></span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

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

          {onCancel && (
            <Button 
              onClick={onCancel}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!initialContent && (
        <div className="flex flex-col justify-evenly gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}>
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
              <Button 
                onClick={handleSend}
                disabled={!content.trim() || disabled}
                size="icon"
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
              </div>
          )}
      </div>

      {/* Format hint */}
      <div className="flex gap-4 ml-1 text-xs text-muted-foreground">
        <span>Press Enter to send</span>
        <span>Shift + Enter for new line</span>
        {isCode && <span>Code formatting enabled</span>}
        {onCancel && <span>Esc to cancel</span>}
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput"; 