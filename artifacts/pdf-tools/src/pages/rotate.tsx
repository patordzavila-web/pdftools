import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { RotateCcw, File, X, Download } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [rotation, setRotation] = useState<string>("90");
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
    setResultBlob(null);
  };

  const handleRotate = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const rotAmount = parseInt(rotation, 10);

      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotAmount));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);
      toast({
        title: "Success!",
        description: "PDF has been rotated successfully."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Rotation failed",
        description: "An error occurred while rotating the PDF.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `rotated_${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Rotate PDF</h1>
          <p className="text-muted-foreground text-lg">Rotate your PDFs the way you need them.</p>
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
                    <File className="w-6 h-6 text-indigo-500 shrink-0" />
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

                <div className="space-y-4 pt-2">
                  <h3 className="font-medium text-lg">Rotation Direction</h3>
                  <RadioGroup value={rotation} onValueChange={setRotation} className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                      <RadioGroupItem value="90" id="r90" />
                      <Label htmlFor="r90" className="cursor-pointer font-medium w-full">Right (90°)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                      <RadioGroupItem value="-90" id="l90" />
                      <Label htmlFor="l90" className="cursor-pointer font-medium w-full">Left (-90°)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                      <RadioGroupItem value="180" id="r180" />
                      <Label htmlFor="r180" className="cursor-pointer font-medium w-full">Upside Down (180°)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button size="lg" onClick={handleRotate} disabled={isProcessing} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
                    {isProcessing ? "Rotating..." : "Rotate PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <RotateCcw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Your PDF has been rotated!</h3>
                <p className="text-green-700">The file is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download Rotated PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); }}>
                  Rotate Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}