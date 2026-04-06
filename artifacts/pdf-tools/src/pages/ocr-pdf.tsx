import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { ScanText, File, X, Copy, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export function OcrPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [language, setLanguage] = useState("eng");
  const [progress, setProgress] = useState<{ current: number; total: number, status: string } | null>(null);
  
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const validFile = newFiles.find(
      (f) => 
        f.type === "application/pdf" || 
        f.type.startsWith("image/") ||
        f.name.toLowerCase().endsWith(".pdf") ||
        f.name.toLowerCase().endsWith(".png") ||
        f.name.toLowerCase().endsWith(".jpg")
    );
    
    if (!validFile) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF or Image file.",
        variant: "destructive",
      });
      return;
    }
    setFile(validFile);
    setExtractedText("");
    setProgress(null);
  };

  const runOcrOnImage = async (imageUrl: string) => {
    const worker = await createWorker(language);
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();
    return text;
  };

  const handleProcess = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setExtractedText("");
      
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      
      if (!isPdf) {
        setProgress({ current: 0, total: 1, status: "Initializing OCR engine..." });
        const imageUrl = URL.createObjectURL(file);
        setProgress({ current: 1, total: 1, status: "Reading text..." });
        const text = await runOcrOnImage(imageUrl);
        setExtractedText(text);
        URL.revokeObjectURL(imageUrl);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        setProgress({ current: 0, total: 1, status: "Loading PDF..." });
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        let fullText = "";
        
        for (let i = 1; i <= numPages; i++) {
          setProgress({ current: i, total: numPages, status: `Processing page ${i} of ${numPages}...` });
          
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            const dataUrl = canvas.toDataURL("image/png");
            
            const pageText = await runOcrOnImage(dataUrl);
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }
        }
        
        setExtractedText(fullText);
      }

      toast({
        title: "Success!",
        description: "Text extraction complete.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: "An error occurred during text extraction.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `ocr_${file?.name.replace(/\.[^/.]+$/, "") || "document"}.txt`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-sky-100 text-sky-600 rounded-full mb-4">
            <ScanText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">OCR PDF</h1>
          <p className="text-muted-foreground text-lg">
            Extract text from scanned PDFs or images using Optical Character Recognition.
          </p>
        </div>

        {!extractedText ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf,image/*"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className="w-6 h-6 text-sky-500 shrink-0" />
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
                    onClick={() => { setFile(null); setProgress(null); }}
                    disabled={isProcessing}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Language</label>
                  <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eng">English</SelectItem>
                      <SelectItem value="spa">Spanish</SelectItem>
                      <SelectItem value="fra">French</SelectItem>
                      <SelectItem value="deu">German</SelectItem>
                      <SelectItem value="por">Portuguese</SelectItem>
                      <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{progress.status}</span>
                    </div>
                    {progress.total > 1 && (
                      <Progress value={(progress.current / progress.total) * 100} />
                    )}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700"
                  >
                    {isProcessing ? "Extracting Text..." : "Extract Text (OCR)"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Extracted Text</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                  <Button variant="default" size="sm" className="bg-sky-600 hover:bg-sky-700" onClick={handleDownloadText}>
                    <Download className="w-4 h-4 mr-2" /> Save .txt
                  </Button>
                </div>
              </div>
              <Textarea 
                value={extractedText} 
                onChange={(e) => setExtractedText(e.target.value)}
                className="min-h-[400px] font-mono text-sm resize-y bg-muted/30"
              />
              <div className="pt-4">
                 <Button variant="outline" className="w-full" onClick={() => { setFile(null); setExtractedText(""); }}>
                   Process Another File
                 </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
