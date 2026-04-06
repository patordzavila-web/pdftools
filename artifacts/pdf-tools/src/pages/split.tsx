import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Scissors, File, X, Download } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [pagesToExtract, setPagesToExtract] = useState("1");
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  const handleFilesSelected = async (newFiles: File[]) => {
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
    setResultBlob(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setTotalPages(pdfDoc.getPageCount());
      setPagesToExtract(`1-${pdfDoc.getPageCount()}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // parse ranges like "1, 3-5, 8"
      const parts = pagesToExtract.split(',').map(p => p.trim());
      const pagesToCopy = new Set<number>();
      
      for (const part of parts) {
        if (part.includes('-')) {
          const [startStr, endStr] = part.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= totalPages) {
            for (let i = start; i <= end; i++) {
              pagesToCopy.add(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(part, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            pagesToCopy.add(pageNum - 1);
          }
        }
      }

      const indices = Array.from(pagesToCopy).sort((a, b) => a - b);
      if (indices.length === 0) {
        toast({
          title: "Invalid range",
          description: "Please enter a valid page range.",
          variant: "destructive"
        });
        return;
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, indices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);
      toast({
        title: "Success!",
        description: "PDF has been split successfully."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Split failed",
        description: "An error occurred while splitting the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `split_${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 text-rose-600 rounded-full mb-4">
            <Scissors className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Split PDF</h1>
          <p className="text-muted-foreground text-lg">Extract pages or separate a PDF into multiple files.</p>
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
                    <File className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} pages
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setFile(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="pages">Pages to extract (e.g. 1, 3-5, 8)</Label>
                    <Input 
                      id="pages" 
                      value={pagesToExtract} 
                      onChange={(e) => setPagesToExtract(e.target.value)} 
                      placeholder="1-5, 8, 11-13"
                    />
                    <p className="text-xs text-muted-foreground">Document has {totalPages} pages in total.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button size="lg" onClick={handleSplit} disabled={isProcessing} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700">
                    {isProcessing ? "Splitting..." : "Split PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Scissors className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Your PDF is ready!</h3>
                <p className="text-green-700">The pages have been extracted successfully.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download Split PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); }}>
                  Split Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}