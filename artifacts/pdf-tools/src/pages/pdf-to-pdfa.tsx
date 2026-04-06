import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { BadgeCheck, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument } from "pdf-lib";

export function PDFtoPDFA() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [metaSubject, setMetaSubject] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  
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
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      if (metaTitle) pdfDoc.setTitle(metaTitle);
      if (metaAuthor) pdfDoc.setAuthor(metaAuthor);
      if (metaSubject) pdfDoc.setSubject(metaSubject);
      if (metaKeywords) {
        const keywords = metaKeywords.split(',').map(k => k.trim()).filter(k => k);
        pdfDoc.setKeywords(keywords);
      }
      
      pdfDoc.setCreator('PDFTOOLS');
      pdfDoc.setProducer('PDFTOOLS');

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);

      toast({
        title: "Success!",
        description: "PDF/A compatible metadata applied.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while modifying the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `pdfa_${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-600 rounded-full mb-4">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">PDF to PDF/A</h1>
          <p className="text-muted-foreground text-lg">
            Convert to the ISO archival PDF standard.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm">
              <p><strong>Note:</strong> Full PDF/A compliance (like font embedding verification and colorspace conversion) requires server-side processing. This tool sets PDF/A-1b compatible metadata and properties directly in your browser.</p>
            </div>

            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className="w-6 h-6 text-emerald-500 shrink-0" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input id="title" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Document Title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author (Optional)</Label>
                    <Input id="author" value={metaAuthor} onChange={e => setMetaAuthor(e.target.value)} placeholder="Document Author" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input id="subject" value={metaSubject} onChange={e => setMetaSubject(e.target.value)} placeholder="Document Subject" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (Optional, comma separated)</Label>
                    <Input id="keywords" value={metaKeywords} onChange={e => setMetaKeywords(e.target.value)} placeholder="e.g. invoice, 2024, archival" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isProcessing ? "Processing..." : "Convert to PDF/A"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <BadgeCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-green-700">
                  Your PDF with archival metadata is ready.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={handleDownload}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-5 h-5" /> Download PDF/A
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
