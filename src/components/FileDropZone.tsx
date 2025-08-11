"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { FaUpload, FaFile, FaX } from "react-icons/fa6";
import { Button } from "./ui/button";

interface FileDropZoneProps {
  onFileContent: (content: string) => void;
  acceptedTypes?: string[];
  className?: string;
}

export const FileDropZone = ({
  onFileContent,
  acceptedTypes = [".txt", ".md", ".rtf"],
  className = "",
}: FileDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      void handleFile(files[0]!);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void handleFile(files[0]!);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Check file type
      const fileName: string = file.name;
      const fileSize: number = file.size;
      const fileExtension = `.${fileName.split('.').pop()?.toLowerCase() ?? ''}`;
      if (!acceptedTypes.includes(fileExtension)) {
        throw new Error(`File type ${fileExtension} not supported. Please use: ${acceptedTypes.join(', ')}`);
      }

      // Check file size (limit to 1MB)
      if (fileSize > 1024 * 1024) {
        throw new Error("File size too large. Please use files smaller than 1MB.");
      }

      const content = await readFileContent(file);
      onFileContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsText(file as Blob);
    });
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" 
            : "border-stone-300 dark:border-stone-600"
          }
          ${isLoading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-stone-400 dark:hover:border-stone-500"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-2">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Reading file...
              </p>
            </>
          ) : (
            <>
              <FaUpload className="h-8 w-8 text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Drop your script file here
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-stone-400">
                Supported: {acceptedTypes.join(', ')} (max 1MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFile className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <FaX className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};