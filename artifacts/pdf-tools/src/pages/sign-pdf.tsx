import { useState, useRef, useEffect } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { PenLine, File, X, Download, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { addRecentFile } from "@/lib/recent-files";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export function SignPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureScale, setSignatureScale] = useState([1]);
  const [targetPage, setTargetPage] = useState("first");
  const [numPages, setNumPages] = useState(0);

  // Signature position as fraction of page (0–1)
  const [sigPos, setSigPos] = useState<{ x: number; y: number } | null>(null);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfFile = newFiles.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      toast({ title: "Invalid file type", description: "Please select a PDF file.", variant: "destructive" });
      return;
    }
    setFile(pdfFile);
    setResultBlob(null);
    setSigPos(null);
  };

  // Render first page as preview
  useEffect(() => {
    if (!file || !previewCanvasRef.current) return;
    (async () => {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setNumPages(pdf.numPages);
      const pg = await pdf.getPage(1);
      const vp = pg.getViewport({ scale: 1.2 });
      const canvas = previewCanvasRef.current!;
      canvas.width = vp.width;
      canvas.height = vp.height;
      setPreviewSize({ w: vp.width, h: vp.height });
      await pg.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    })();
  }, [file]);

  // Init signature canvas
  useEffect(() => {
    if (!sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
  }, [file]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    if (e.pointerType === "touch") canvas.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    if (e.pointerType === "touch") sigCanvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setSigPos({ x, y });
  };

  const getSignatureBlob = (): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      sigCanvasRef.current!.toBlob((blob) => {
        if (!blob) { reject(new Error("Could not read signature")); return; }
        blob.arrayBuffer().then(resolve).catch(reject);
      }, "image/png");
    });
  };

  const handleApplySignature = async () => {
    if (!file || !sigCanvasRef.current) return;
    try {
      setIsProcessing(true);
      const sigBytes = await getSignatureBlob();
      const pdfBytesOrig = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytesOrig);
      const pngImage = await pdfDoc.embedPng(sigBytes);

      const sigWidth = 150 * signatureScale[0];
      const sigHeight = (pngImage.height / pngImage.width) * sigWidth;
      const pages = pdfDoc.getPages();

      const pagesToSign =
        targetPage === "all" ? pages :
        targetPage === "first" ? [pages[0]] :
        targetPage === "last" ? [pages[pages.length - 1]] :
        [pages[0]];

      pagesToSign.forEach((page) => {
        const { width, height } = page.getSize();
        let px: number, py: number;
        if (sigPos) {
          px = sigPos.x * width - sigWidth / 2;
          py = (1 - sigPos.y) * height - sigHeight / 2;
        } else {
          px = width - sigWidth - 20;
          py = 20;
        }
        page.drawImage(pngImage, { x: px, y: py, width: sigWidth, height: sigHeight });
      });

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultBlob(blob);
      addRecentFile({ name: file.name, tool: "Sign PDF", toolPath: "/sign-pdf", timestamp: Date.now(), size: file.size });
      toast({ title: "Success!", description: "Signature applied to PDF." });
    } catch (err: any) {
      toast({ title: "Processing failed", description: err?.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <PenLine className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Sign PDF</h1>
          <p className="text-muted-foreground text-lg">Draw your signature and place it exactly where you want.</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone onFilesSelected={handleFilesSelected} accept=".pdf,application/pdf" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="w-5 h-5 text-indigo-500 shrink-0" />
                      <p className="text-sm font-medium truncate">{file.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => { setFile(null); setSigPos(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">1. Draw your signature</Label>
                      <Button variant="ghost" size="sm" onClick={clearSignature} className="h-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3 h-3 mr-1" /> Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white touch-none">
                      <canvas
                        ref={sigCanvasRef}
                        width={500} height={180}
                        className="w-full h-[180px] cursor-crosshair touch-none"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>2. Signature size: {Math.round(signatureScale[0] * 100)}%</Label>
                      <Slider value={signatureScale} min={0.3} max={3} step={0.1} onValueChange={setSignatureScale} />
                    </div>
                    <div className="space-y-2">
                      <Label>3. Apply to page</Label>
                      <Select value={targetPage} onValueChange={setTargetPage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first">First Page</SelectItem>
                          <SelectItem value="last">Last Page</SelectItem>
                          <SelectItem value="all">All Pages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleApplySignature}
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isProcessing ? "Applying…" : "Apply Signature"}
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    4. Click on the page preview to position your signature
                    {sigPos ? ` — positioned at ${Math.round(sigPos.x * 100)}%, ${Math.round(sigPos.y * 100)}%` : " (or leave blank for bottom-right)"}
                  </p>
                  <div className="relative border rounded-xl overflow-hidden bg-muted/10 cursor-crosshair">
                    <canvas
                      ref={previewCanvasRef}
                      className="w-full h-auto block"
                      onClick={handlePreviewClick}
                    />
                    {sigPos && previewSize.w > 0 && (
                      <div
                        className="absolute pointer-events-none border-2 border-indigo-500 rounded bg-indigo-500/10"
                        style={{
                          left: `calc(${sigPos.x * 100}% - 40px)`,
                          top: `calc(${sigPos.y * 100}% - 15px)`,
                          width: 80,
                          height: 30,
                        }}
                      />
                    )}
                  </div>
                  {sigPos && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setSigPos(null)}>
                      Reset position
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="flex flex-col items-center py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <PenLine className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">Signature Applied!</h3>
                <p className="text-green-700 dark:text-green-400">Your signed PDF is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => saveAs(resultBlob!, `signed_${file?.name || "document.pdf"}`)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); setSigPos(null); }}>
                  Sign Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
