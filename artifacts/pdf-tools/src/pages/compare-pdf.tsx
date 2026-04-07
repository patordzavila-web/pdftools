import { useState, useRef } from "react";
import { Layout } from "./home";
import { Button } from "@/components/ui/button";
import { GitCompare, File, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

export function ComparePDF() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [pageA, setPageA] = useState(1);
  const [pageB, setPageB] = useState(1);
  const [totalA, setTotalA] = useState(0);
  const [totalB, setTotalB] = useState(0);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const renderPage = async (
    file: File,
    page: number,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    setLoading: (v: boolean) => void,
    setTotal: (v: number) => void
  ) => {
    try {
      setLoading(true);
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setTotal(pdf.numPages);
      const pg = await pdf.getPage(Math.min(page, pdf.numPages));
      const viewport = pg.getViewport({ scale: 1.4 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await pg.render({ canvasContext: ctx, viewport }).promise;
    } catch (err: any) {
      toast({ title: "Render error", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileA(f);
    setPageA(1);
    await renderPage(f, 1, canvasARef, setIsLoadingA, setTotalA);
  };

  const handleFileB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileB(f);
    setPageB(1);
    await renderPage(f, 1, canvasBRef, setIsLoadingB, setTotalB);
  };

  const goA = async (dir: number) => {
    if (!fileA) return;
    const next = Math.max(1, Math.min(totalA, pageA + dir));
    setPageA(next);
    await renderPage(fileA, next, canvasARef, setIsLoadingA, setTotalA);
  };

  const goB = async (dir: number) => {
    if (!fileB) return;
    const next = Math.max(1, Math.min(totalB, pageB + dir));
    setPageB(next);
    await renderPage(fileB, next, canvasBRef, setIsLoadingB, setTotalB);
  };

  const PdfPane = ({
    label,
    file,
    page,
    total,
    loading,
    canvasRef,
    onFile,
    onPrev,
    onNext,
    onClear,
  }: {
    label: string;
    file: File | null;
    page: number;
    total: number;
    loading: boolean;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPrev: () => void;
    onNext: () => void;
    onClear: () => void;
  }) => (
    <div className="flex flex-col flex-1 min-w-0 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base">{label}</span>
        {file && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!file ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-64 cursor-pointer hover:bg-muted/30 transition-colors gap-3 text-muted-foreground">
          <File className="w-10 h-10" />
          <span className="text-sm">Click to select PDF</span>
          <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={onFile} />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <File className="w-3 h-3 shrink-0" /> {file.name}
          </div>
          <div className="border rounded-xl overflow-auto bg-muted/10 flex justify-center p-2 min-h-[400px] relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
          {total > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} / {total}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} disabled={page >= total}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-teal-100 text-teal-600 rounded-full mb-4">
            <GitCompare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Compare PDFs</h1>
          <p className="text-muted-foreground text-lg">View two PDF documents side by side.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <PdfPane
            label="Document A"
            file={fileA}
            page={pageA}
            total={totalA}
            loading={isLoadingA}
            canvasRef={canvasARef}
            onFile={handleFileA}
            onPrev={() => goA(-1)}
            onNext={() => goA(1)}
            onClear={() => { setFileA(null); setPageA(1); setTotalA(0); }}
          />
          <div className="hidden md:flex items-center">
            <div className="w-px h-full bg-border" />
          </div>
          <PdfPane
            label="Document B"
            file={fileB}
            page={pageB}
            total={totalB}
            loading={isLoadingB}
            canvasRef={canvasBRef}
            onFile={handleFileB}
            onPrev={() => goB(-1)}
            onNext={() => goB(1)}
            onClear={() => { setFileB(null); setPageB(1); setTotalB(0); }}
          />
        </div>
      </div>
    </Layout>
  );
}
