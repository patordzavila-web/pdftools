import { useState, useRef, useCallback } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  accept = "application/pdf",
  multiple = false,
  className
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        onFilesSelected(filesArray);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer bg-card overflow-hidden group",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
      />
      
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className={cn(
          "p-4 rounded-full bg-primary/10 text-primary transition-transform duration-300",
          isDragging ? "scale-110" : "group-hover:scale-105"
        )}>
          <UploadCloud className="w-10 h-10" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground mb-1">
            {isDragging ? "Drop files here" : "Click or drag files here"}
          </p>
          <p className="text-sm text-muted-foreground">
            {multiple ? "Select multiple files to process" : "Select a file to process"}
          </p>
        </div>
      </div>
    </div>
  );
}