import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { FileText, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export function PDFToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
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
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const paragraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Basic heuristic: join items with space, add a paragraph
        const textItems = textContent.items as any[];
        const text = textItems.map(item => item.str).join(" ");
        
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      setResultBlob(blob);

      toast({
        title: "Success!",
        description: "PDF has been converted to Word.",
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
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `converted_${file?.name.replace(/\.[^/.]+$/, "") || "document"}.docx`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-full mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PDF to Word</h1>
          <p className="text-muted-foreground text-lg">
            Convert PDF to editable Word document.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Note: This extraction is text-only. Formatting is not preserved.
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
                    <File className="w-6 h-6 text-blue-500 shrink-0" />
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
                    onClick={() => setFile(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? "Converting..." : "Convert to Word"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-green-700">
                  Your Word document is ready for download.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-5 h-5" /> Download Word File
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResultBlob(null);
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
