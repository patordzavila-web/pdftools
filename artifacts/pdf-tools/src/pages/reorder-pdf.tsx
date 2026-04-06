import { useState, useEffect } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { GalleryHorizontal, File, X, Download, GripVertical } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

interface Thumbnail {
  index: number;
  originalIndex: number;
  dataUrl: string;
}

export function ReorderPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingThumbs, setIsLoadingThumbs] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfFile = newFiles.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }
    setFile(pdfFile);
    setResultBlob(null);
    setThumbnails([]);
  };

  useEffect(() => {
    if (file && thumbnails.length === 0) {
      loadThumbnails();
    }
  }, [file]);

  const loadThumbnails = async () => {
    if (!file) return;
    try {
      setIsLoadingThumbs(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      const thumbs: Thumbnail[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnails
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          thumbs.push({
            index: i - 1,
            originalIndex: i - 1,
            dataUrl: canvas.toDataURL("image/jpeg", 0.8),
          });
        }
      }
      setThumbnails(thumbs);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load pages",
        description: "Could not generate page thumbnails.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingThumbs(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...thumbnails];
    const draggedItem = items[draggedIndex];
    
    // Remove from old position
    items.splice(draggedIndex, 1);
    // Insert at new position
    items.splice(index, 0, draggedItem);
    
    // Update local indices
    const updatedItems = items.map((item, i) => ({ ...item, index: i }));
    
    setThumbnails(updatedItems);
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const handleReorder = async () => {
    if (!file || thumbnails.length === 0) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const indicesToCopy = thumbnails.map(t => t.originalIndex);
      const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
      
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);

      toast({
        title: "Success!",
        description: "PDF pages have been reordered.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: "An error occurred while reordering pages.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `reordered_${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-violet-100 text-violet-600 rounded-full mb-4">
            <GalleryHorizontal className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reorder PDF</h1>
          <p className="text-muted-foreground text-lg">
            Drag and drop pages to reorder your PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className="w-6 h-6 text-violet-500 shrink-0" />
                    <div>
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {thumbnails.length > 0 ? `${thumbnails.length} pages • ` : ''}
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      setFile(null);
                      setThumbnails([]);
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="pt-2">
                  {isLoadingThumbs ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {thumbnails.map((thumb, index) => (
                        <div
                          key={thumb.originalIndex}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={handleDrop}
                          className={`relative border-2 rounded-lg overflow-hidden bg-white shadow-sm cursor-grab active:cursor-grabbing transition-colors
                            ${draggedIndex === index ? 'border-violet-500 opacity-50' : 'border-border hover:border-violet-300'}`}
                        >
                          <div className="bg-muted/50 text-xs font-semibold px-2 py-1 text-center border-b flex items-center justify-between">
                            <GripVertical className="w-3 h-3 text-muted-foreground" />
                            Page {index + 1}
                            <div className="w-3" />
                          </div>
                          <div className="p-2 flex justify-center bg-muted/20">
                            <img src={thumb.dataUrl} alt={`Page ${index + 1}`} className="max-w-full h-auto object-contain border shadow-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end border-t mt-6">
                  <Button
                    size="lg"
                    onClick={handleReorder}
                    disabled={isProcessing || isLoadingThumbs || thumbnails.length === 0}
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
                  >
                    {isProcessing ? "Saving..." : "Save Reordered PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <GalleryHorizontal className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  PDF Reordered!
                </h3>
                <p className="text-green-700">
                  Your pages have been successfully reordered.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResultBlob(null);
                    setThumbnails([]);
                  }}
                >
                  Reorder Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
