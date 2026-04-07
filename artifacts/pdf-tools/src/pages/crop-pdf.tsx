import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Crop, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PDFDocument } from "pdf-lib";
import { addRecentFile } from "@/lib/recent-files";

export function CropPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [top, setTop] = useState("0");
  const [right, setRight] = useState("0");
  const [bottom, setBottom] = useState("0");
  const [left, setLeft] = useState("0");
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

  const handleCrop = async () => {
    if (!file) return;
    const t = parseFloat(top) || 0;
    const r = parseFloat(right) || 0;
    const b = parseFloat(bottom) || 0;
    const l = parseFloat(left) || 0;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const x = l;
        const y = b;
        const w = Math.max(10, width - l - r);
        const h = Math.max(10, height - t - b);
        page.setCropBox(x, y, w, h);
        page.setMediaBox(x, y, w, h);
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultBlob(blob);
      addRecentFile({ name: file.name, tool: "Crop PDF", toolPath: "/crop-pdf", timestamp: Date.now(), size: file.size });
      toast({ title: "Done!", description: `Cropped ${pages.length} pages.` });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Could not crop PDF.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const MarginInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        <Input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} className="text-center" />
        <span className="text-xs text-muted-foreground shrink-0">pt</span>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 text-orange-600 rounded-full mb-4">
            <Crop className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Crop PDF</h1>
          <p className="text-muted-foreground text-lg">Trim margins from every page of your PDF.</p>
          <p className="text-sm text-muted-foreground mt-1">Enter how many points to remove from each edge (1 inch ≈ 72 pt).</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone onFilesSelected={handleFilesSelected} accept=".pdf,application/pdf" />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File className="w-5 h-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-center text-muted-foreground">Crop margins (applied to all pages)</p>
                  <div className="flex justify-center">
                    <MarginInput label="Top" value={top} onChange={setTop} />
                  </div>
                  <div className="flex justify-center gap-12">
                    <MarginInput label="Left" value={left} onChange={setLeft} />
                    <div className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-md text-xs text-muted-foreground">
                      Page
                    </div>
                    <MarginInput label="Right" value={right} onChange={setRight} />
                  </div>
                  <div className="flex justify-center">
                    <MarginInput label="Bottom" value={bottom} onChange={setBottom} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                  <Button onClick={handleCrop} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-700">
                    {isProcessing ? "Cropping…" : "Crop PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="flex flex-col items-center py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Crop className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">PDF Cropped!</h3>
                <p className="text-green-700 dark:text-green-400">Your cropped PDF is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => saveAs(resultBlob!, `cropped_${file?.name || "document.pdf"}`)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); }}>
                  Crop Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
