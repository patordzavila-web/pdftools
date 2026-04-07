import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Languages, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import * as pdfjsLib from "pdfjs-dist";
import { addRecentFile } from "@/lib/recent-files";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

const LANGUAGES = [
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ko", label: "Korean" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "en", label: "English" },
];

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=autodetect|${targetLang}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.responseData?.translatedText || text;
}

export function TranslatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("es");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
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

  const handleTranslate = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setProgress("Extracting text…");

      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      const numPages = pdf.numPages;

      const docChildren: any[] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Translating page ${i} of ${numPages}…`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as any[];
        const pageText = items.map(it => it.str).join(" ").trim();

        if (!pageText) continue;

        const chunks = pageText.match(/.{1,400}(\s|$)/g) || [pageText];
        let translated = "";
        for (const chunk of chunks) {
          const t = await translateText(chunk, targetLang);
          translated += t + " ";
        }

        if (i > 1) {
          docChildren.push(new Paragraph({ text: "" }));
        }
        docChildren.push(
          new Paragraph({
            text: `— Page ${i} —`,
            heading: HeadingLevel.HEADING_2,
          })
        );
        docChildren.push(
          new Paragraph({ children: [new TextRun(translated.trim())] })
        );
      }

      setProgress("Building document…");
      const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
      });
      const blob = await Packer.toBlob(doc);
      setResultBlob(blob);
      addRecentFile({ name: file.name, tool: "Translate PDF", toolPath: "/translate-pdf", timestamp: Date.now(), size: file.size });
      toast({ title: "Translation complete!", description: `Translated ${numPages} pages.` });
    } catch (err: any) {
      toast({ title: "Translation failed", description: err?.message || "Could not translate.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const langLabel = LANGUAGES.find(l => l.code === targetLang)?.label || "Spanish";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-4">
            <Languages className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Translate PDF</h1>
          <p className="text-muted-foreground text-lg">Extract and translate PDF text into another language.</p>
          <p className="text-sm text-muted-foreground mt-1">Output is a Word document (.docx) with the translated text.</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone onFilesSelected={handleFilesSelected} accept=".pdf,application/pdf" />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <File className="w-5 h-5 text-purple-500 shrink-0" />
                    <div>
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Translate to</Label>
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => (
                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isProcessing && progress && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border text-sm text-muted-foreground">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full shrink-0" />
                    {progress}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setFile(null)} disabled={isProcessing}>Cancel</Button>
                  <Button onClick={handleTranslate} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
                    {isProcessing ? "Translating…" : `Translate to ${langLabel}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="flex flex-col items-center py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Languages className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">Translation Ready!</h3>
                <p className="text-green-700 dark:text-green-400">Your translated Word document is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => saveAs(resultBlob!, `translated_${file?.name?.replace(/\.pdf$/i, "") || "document"}.docx`)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download Word File
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); }}>
                  Translate Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
