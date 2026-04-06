import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Presentation, File, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import pptxgen from "pptxgenjs";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export function PDFToPPT() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [resultReady, setResultReady] = useState(false);
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
    setResultReady(false);
    setProgress(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setProgress({ current: 0, total: numPages });

      const pptx = new pptxgen();

      for (let i = 1; i <= numPages; i++) {
        setProgress({ current: i, total: numPages });
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, x: 0, y: 0, w: "100%", h: "100%" });
      }

      await pptx.writeFile({ fileName: `converted_${file.name.replace(/\.[^/.]+$/, "") || "document"}.pptx` });

      setResultReady(true);
      toast({
        title: "Success!",
        description: "PDF has been converted to PowerPoint.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 text-orange-600 rounded-full mb-4">
            <Presentation className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PDF to PowerPoint</h1>
          <p className="text-muted-foreground text-lg">
            Convert PDF pages to PowerPoint slides.
          </p>
        </div>

        {!resultReady ? (
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
                    <File className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
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
                      setProgress(null);
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>
                        {progress.current} of {progress.total} pages
                      </span>
                    </div>
                    <Progress value={(progress.current / progress.total) * 100} />
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                  >
                    {isProcessing ? "Converting..." : "Convert to PPT"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Presentation className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-green-700">
                  Your PowerPoint file should have downloaded automatically.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResultReady(false);
                  }}
                >
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
