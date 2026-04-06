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

export function SignPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureScale, setSignatureScale] = useState([1]);
  const [targetPage, setTargetPage] = useState("all");
  
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

  useEffect(() => {
    if (file && !resultBlob && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "black";
      }
    }
  }, [file, resultBlob]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Prevent scrolling on touch
    if (e.pointerType === 'touch') {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    if (e.pointerType === 'touch') {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplySignature = async () => {
    if (!file || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
      const signatureBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      
      const pdfBytesOrig = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytesOrig);
      
      const pngImage = await pdfDoc.embedPng(signatureBytes);
      
      // Default signature width is 150, scaled by user
      const sigWidth = 150 * signatureScale[0];
      const sigHeight = (pngImage.height / pngImage.width) * sigWidth;
      
      const pages = pdfDoc.getPages();
      
      const pagesToSign = targetPage === "all" ? pages : targetPage === "first" ? [pages[0]] : [pages[pages.length - 1]];
      
      pagesToSign.forEach(page => {
        const { width, height } = page.getSize();
        page.drawImage(pngImage, {
          x: width - sigWidth - 20, // 20px padding from right
          y: 20, // 20px padding from bottom
          width: sigWidth,
          height: sigHeight,
        });
      });

      const pdfBytesResult = await pdfDoc.save();
      const blob = new Blob([pdfBytesResult], { type: "application/pdf" });
      setResultBlob(blob);

      toast({
        title: "Success!",
        description: "Signature applied to PDF.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: "An error occurred while applying the signature.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `signed_${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <PenLine className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Sign PDF</h1>
          <p className="text-muted-foreground text-lg">
            Draw and embed your signature in a PDF.
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
                    <File className="w-6 h-6 text-indigo-600 shrink-0" />
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

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Draw your signature</Label>
                      <Button variant="ghost" size="sm" onClick={clearSignature} className="h-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white flex justify-center touch-none">
                      <canvas 
                        ref={canvasRef} 
                        width={600} 
                        height={200} 
                        className="w-full max-w-[600px] h-[200px] cursor-crosshair touch-none"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-3">
                      <Label>Signature Size: {Math.round(signatureScale[0] * 100)}%</Label>
                      <Slider 
                        value={signatureScale} 
                        min={0.5} max={2} step={0.1} 
                        onValueChange={setSignatureScale} 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Place signature on</Label>
                      <Select value={targetPage} onValueChange={setTargetPage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pages" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="first">First Page Only</SelectItem>
                          <SelectItem value="last">Last Page Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleApplySignature}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isProcessing ? "Applying..." : "Apply Signature to PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <PenLine className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Signature Applied!
                </h3>
                <p className="text-green-700">
                  Your signed PDF is ready for download.
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
