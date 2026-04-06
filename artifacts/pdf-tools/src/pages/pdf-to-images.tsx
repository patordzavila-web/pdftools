import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { ImageDown, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

export function PDFToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfFile = newFiles.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith('.pdf'));
    if (!pdfFile) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }
    setFile(pdfFile);
    setImages([]);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const generatedImages = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2; // high quality
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
          const dataUrl = canvas.toDataURL("image/png");
          generatedImages.push({
            url: dataUrl,
            name: `${file.name.replace('.pdf', '')}_page_${i}.png`
          });
        }
      }

      setImages(generatedImages);
      toast({
        title: "Success!",
        description: "PDF has been converted to images."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = () => {
    images.forEach(img => {
      saveAs(img.url, img.name);
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-600 rounded-full mb-4">
            <ImageDown className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PDF to Images</h1>
          <p className="text-muted-foreground text-lg">Convert each page of your PDF into high-quality images.</p>
        </div>

        {images.length === 0 ? (
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
                    <File className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setFile(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button size="lg" onClick={handleConvert} disabled={isProcessing} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700">
                    {isProcessing ? "Converting..." : "Convert to JPG"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <ImageDown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Images ready!</h3>
                <p className="text-green-700">Generated {images.length} images.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl my-6">
                {images.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-[3/4] bg-white rounded border overflow-hidden shadow-sm">
                    <img src={img.url} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="col-span-full text-sm text-muted-foreground pt-2">
                    ...and {images.length - 4} more
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={downloadAll} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download All Images
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setImages([]); }}>
                  Convert Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}