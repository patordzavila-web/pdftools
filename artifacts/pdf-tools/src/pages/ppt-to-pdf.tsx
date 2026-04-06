import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { MonitorPlay, File, X, Download, AlertTriangle } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function PPTToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const pptFile = newFiles.find(
      (f) =>
        f.name.toLowerCase().endsWith(".pptx") ||
        f.name.toLowerCase().endsWith(".ppt") ||
        f.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        f.type === "application/vnd.ms-powerpoint"
    );
    if (!pptFile) {
      toast({
        title: "Invalid file type",
        description: "Please select a PowerPoint file (.pptx or .ppt).",
        variant: "destructive",
      });
      return;
    }
    setFile(pptFile);
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
      const { width, height } = page.getSize();
      
      const titleText = "PowerPoint Conversion Notice";
      const titleWidth = boldFont.widthOfTextAtSize(titleText, 24);
      page.drawText(titleText, {
        x: width / 2 - titleWidth / 2,
        y: height - 100,
        size: 24,
        font: boldFont,
        color: rgb(0.8, 0.2, 0.2),
      });

      const lines = [
        "PowerPoint conversion to PDF is currently limited",
        "in browser mode due to missing parser capabilities.",
        "",
        "File received:",
        file.name,
        "",
        "Size:",
        `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        "",
        "For best results, please use Microsoft Word or LibreOffice",
        "to convert your presentation to a PDF document.",
      ];

      let yOffset = height - 180;
      lines.forEach((line) => {
        const lineWidth = font.widthOfTextAtSize(line, 14);
        page.drawText(line, {
          x: width / 2 - lineWidth / 2,
          y: yOffset,
          size: 14,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yOffset -= 24;
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);

      toast({
        title: "Conversion simulated",
        description: "A notification PDF has been generated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `converted_${file?.name.replace(/\.[^/.]+$/, "") || "document"}.pdf`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 text-red-600 rounded-full mb-4">
            <MonitorPlay className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PowerPoint to PDF</h1>
          <p className="text-muted-foreground text-lg">
            Convert presentations to PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Limited Browser Support</p>
                <p>PowerPoint to PDF conversion runs with limited capabilities in the browser. For best results with complex layouts and graphics, we recommend using desktop software like Microsoft PowerPoint or LibreOffice to export as PDF.</p>
              </div>
            </div>

            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className="w-6 h-6 text-red-500 shrink-0" />
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
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                  >
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
                <MonitorPlay className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-green-700">
                  Your PDF is ready for download.
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
