import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Hash, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { addRecentFile } from "@/lib/recent-files";

export function PageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [position, setPosition] = useState("bottom-center");
  const [startNumber, setStartNumber] = useState("1");
  const [fontSize, setFontSize] = useState("12");
  const [format, setFormat] = useState("number");
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfFile = newFiles.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      toast({ title: "Invalid file", description: "Please select a PDF file.", variant: "destructive" });
      return;
    }
    setFile(pdfFile);
    setResultBlob(null);
  };

  const handleApply = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const start = parseInt(startNumber) || 1;
      const size = parseInt(fontSize) || 12;
      const margin = 24;

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const pageNum = start + i;
        const total = pages.length;
        const label =
          format === "number" ? `${pageNum}` :
          format === "of" ? `${pageNum} of ${total}` :
          format === "dash" ? `- ${pageNum} -` : `${pageNum}`;

        const textWidth = font.widthOfTextAtSize(label, size);

        let x = 0;
        let y = 0;

        if (position === "bottom-center") { x = (width - textWidth) / 2; y = margin; }
        else if (position === "bottom-left") { x = margin; y = margin; }
        else if (position === "bottom-right") { x = width - textWidth - margin; y = margin; }
        else if (position === "top-center") { x = (width - textWidth) / 2; y = height - margin - size; }
        else if (position === "top-left") { x = margin; y = height - margin - size; }
        else if (position === "top-right") { x = width - textWidth - margin; y = height - margin - size; }

        page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultBlob(blob);
      addRecentFile({ name: file.name, tool: "Page Numbers", toolPath: "/page-numbers", timestamp: Date.now(), size: file.size });
      toast({ title: "Done!", description: `Page numbers added to ${pages.length} pages.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Could not add page numbers.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-sky-100 text-sky-600 rounded-full mb-4">
            <Hash className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Add Page Numbers</h1>
          <p className="text-muted-foreground text-lg">Stamp page numbers onto every page of your PDF.</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone onFilesSelected={handleFilesSelected} accept=".pdf,application/pdf" />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File className="w-5 h-5 text-sky-500 shrink-0" />
                    <div>
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="top-center">Top Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">1, 2, 3…</SelectItem>
                        <SelectItem value="of">1 of 10…</SelectItem>
                        <SelectItem value="dash">- 1 -</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start from</Label>
                    <Input type="number" min="1" value={startNumber} onChange={e => setStartNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Font size (pt)</Label>
                    <Input type="number" min="6" max="36" value={fontSize} onChange={e => setFontSize(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                  <Button onClick={handleApply} disabled={isProcessing} className="bg-sky-600 hover:bg-sky-700">
                    {isProcessing ? "Adding numbers…" : "Add Page Numbers"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="flex flex-col items-center py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Hash className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">Page Numbers Added!</h3>
                <p className="text-green-700 dark:text-green-400">Your PDF is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => saveAs(resultBlob!, `numbered_${file?.name || "document.pdf"}`)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); }}>
                  Number Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
