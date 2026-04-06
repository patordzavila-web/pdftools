import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Images, Image as ImageIcon, X, Download, ArrowUp, ArrowDown } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export function ImagesToPDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Only image files (PNG, JPG, etc.) are supported.",
        variant: "destructive"
      });
    }
    setFiles((prev) => [...prev, ...imageFiles]);
    setResultBlob(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResultBlob(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const newFiles = [...prev];
      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      return newFiles;
    });
  };

  const loadImageToCanvas = (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Failed to load ${file.name}`)); };
      img.src = objectUrl;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    try {
      setIsProcessing(true);
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const canvas = await loadImageToCanvas(file);
        const pngBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
            blob.arrayBuffer().then(resolve).catch(reject);
          }, 'image/png');
        });
        const image = await pdfDoc.embedPng(pngBytes);

        const dims = image.scale(1);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);
      toast({
        title: "Success!",
        description: "Images have been converted to PDF."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the images.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, "images_document.pdf");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-violet-100 text-violet-600 rounded-full mb-4">
            <Images className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Images to PDF</h1>
          <p className="text-muted-foreground text-lg">Convert and arrange your images into a single PDF.</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            <FileDropzone 
              onFilesSelected={handleFilesSelected} 
              multiple 
              accept="image/*"
            />

            {files.length > 0 && (
              <div className="space-y-4 bg-card p-6 rounded-xl border shadow-sm">
                <h3 className="font-semibold text-lg border-b pb-2">Selected Images ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <ImageIcon className="w-5 h-5 text-violet-500 shrink-0" />
                        <span className="truncate font-medium text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveUp(index)} disabled={index === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveDown(index)} disabled={index === files.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFile(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex justify-end">
                  <Button size="lg" onClick={handleConvert} disabled={isProcessing || files.length === 0} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700">
                    {isProcessing ? "Converting..." : "Convert to PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Images className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Your PDF is ready!</h3>
                <p className="text-green-700">The images have been converted to a PDF document.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFiles([]); setResultBlob(null); }}>
                  Convert More Images
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}