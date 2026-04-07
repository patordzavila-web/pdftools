import { useState, useRef, useEffect } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { PenSquare, File, X, Download, Type, Square, Minus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { addRecentFile } from "@/lib/recent-files";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

type ElementType = "text" | "rectangle" | "line";

interface EditorElement {
  id: string;
  type: ElementType;
  pageIndex: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  color: string;
  opacity: number;
  fontSize?: number;
}

export function EditPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [textInput, setTextInput] = useState("New Text");
  const [colorInput, setColorInput] = useState("#000000");
  const [fontSizeInput, setFontSizeInput] = useState("16");
  const [opacityInput, setOpacityInput] = useState([1]);

  const { toast } = useToast();

  const renderPage = async (pg: number) => {
    if (!file || !canvasRef.current) return;
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      setTotalPages(pdf.numPages);
      const page = await pdf.getPage(pg);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setCanvasDimensions({ width: viewport.width, height: viewport.height });
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (file) renderPage(currentPage);
  }, [file, currentPage]);

  const changePage = (dir: number) => {
    const next = Math.max(1, Math.min(totalPages, currentPage + dir));
    if (next !== currentPage) {
      setCurrentPage(next);
      setSelectedId(null);
    }
  };

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
    setElements([]);
    setSelectedId(null);
    setCurrentPage(1);
  };

  const addElement = (type: ElementType) => {
    const el: EditorElement = {
      id: Math.random().toString(36).slice(2),
      type,
      pageIndex: currentPage - 1,
      x: canvasDimensions.width / 2 - 50,
      y: canvasDimensions.height / 2 - 20,
      w: type === "rectangle" ? 100 : type === "line" ? 150 : undefined,
      h: type === "rectangle" ? 60 : type === "line" ? 2 : undefined,
      text: type === "text" ? textInput : undefined,
      color: colorInput,
      opacity: opacityInput[0],
      fontSize: type === "text" ? parseInt(fontSizeInput) : undefined,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255 } : { r: 0, g: 0, b: 0 };
  };

  const handleApplyAndDownload = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      const ab = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pages = pdfDoc.getPages();

      for (const el of elements) {
        const page = pages[el.pageIndex];
        if (!page) continue;
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        const scaleX = pdfWidth / canvasDimensions.width;
        const scaleY = pdfHeight / canvasDimensions.height;
        const pdfX = el.x * scaleX;
        const pdfY = pdfHeight - el.y * scaleY;
        const c = hexToRgb(el.color);
        const col = rgb(c.r, c.g, c.b);

        if (el.type === "text" && el.text) {
          const fs = (el.fontSize || 16) * scaleY;
          page.drawText(el.text, { x: pdfX, y: pdfY - fs, size: fs, color: col, opacity: el.opacity });
        } else if (el.type === "rectangle" && el.w && el.h) {
          page.drawRectangle({ x: pdfX, y: pdfY - el.h * scaleY, width: el.w * scaleX, height: el.h * scaleY, color: col, opacity: el.opacity });
        } else if (el.type === "line" && el.w) {
          page.drawLine({ start: { x: pdfX, y: pdfY }, end: { x: pdfX + el.w * scaleX, y: pdfY }, thickness: 2, color: col, opacity: el.opacity });
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultBlob(blob);
      addRecentFile({ name: file.name, tool: "Edit PDF", toolPath: "/edit-pdf", timestamp: Date.now(), size: file.size });
      toast({ title: "Done!", description: "Changes applied to PDF." });
    } catch (err: any) {
      toast({ title: "Processing failed", description: err?.message || "Could not apply changes.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    e.dataTransfer.setData("ox", (e.clientX - rect.left).toString());
    e.dataTransfer.setData("oy", (e.clientY - rect.top).toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const id = e.dataTransfer.getData("text/plain");
    const ox = parseFloat(e.dataTransfer.getData("ox"));
    const oy = parseFloat(e.dataTransfer.getData("oy"));
    const cr = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, e.clientX - cr.left - ox);
    const newY = Math.max(0, e.clientY - cr.top - oy);
    setElements(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
  };

  const pageElements = elements.filter(el => el.pageIndex === currentPage - 1);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-4">
            <PenSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Edit PDF</h1>
          <p className="text-muted-foreground text-lg">Add text, shapes and lines to any page of your PDF.</p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone onFilesSelected={handleFilesSelected} accept=".pdf,application/pdf" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-semibold border-b pb-2">Tools</h3>
                    <div className="space-y-2">
                      <Label>Text content</Label>
                      <Input value={textInput} onChange={e => setTextInput(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Color</Label>
                        <Input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} className="h-9 px-1 py-1" />
                      </div>
                      <div className="space-y-1">
                        <Label>Font size</Label>
                        <Input type="number" value={fontSizeInput} onChange={e => setFontSizeInput(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1 pb-2">
                      <Label>Opacity: {opacityInput[0]}</Label>
                      <Slider value={opacityInput} min={0.1} max={1} step={0.1} onValueChange={setOpacityInput} />
                    </div>
                    <div className="grid gap-2 pt-2 border-t">
                      <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("text")}>
                        <Type className="w-4 h-4" /> Add Text
                      </Button>
                      <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("rectangle")}>
                        <Square className="w-4 h-4" /> Add Rectangle
                      </Button>
                      <Button variant="outline" className="justify-start gap-2" onClick={() => addElement("line")}>
                        <Minus className="w-4 h-4" /> Add Line
                      </Button>
                    </div>
                  </div>

                  <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
                    <h3 className="font-semibold border-b pb-2">Elements on page {currentPage}</h3>
                    {pageElements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None yet.</p>
                    ) : (
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {pageElements.map((el, i) => (
                          <div
                            key={el.id}
                            className={`flex items-center justify-between p-2 rounded-md border text-sm cursor-pointer ${selectedId === el.id ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-border"}`}
                            onClick={() => setSelectedId(el.id)}
                          >
                            <span className="truncate max-w-[110px]">
                              {el.type === "text" ? `Text: ${el.text}` : `${el.type} ${i + 1}`}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {elements.length} element(s) total across {new Set(elements.map(e => e.pageIndex)).size} page(s)
                    </p>
                  </div>

                  <Button size="lg" onClick={handleApplyAndDownload} disabled={isProcessing || elements.length === 0} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isProcessing ? "Applying…" : "Apply & Download"}
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => setFile(null)}>Cancel</Button>
                </div>

                <div className="lg:col-span-3 space-y-3">
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3 justify-center">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changePage(-1)} disabled={currentPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => changePage(1)} disabled={currentPage >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-xl border flex justify-center overflow-auto p-4 max-h-[800px]">
                    <div
                      ref={containerRef}
                      className="relative bg-white shadow-sm ring-1 ring-border"
                      style={{ width: canvasDimensions.width || "auto", height: canvasDimensions.height || "auto" }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      <canvas ref={canvasRef} className="max-w-full block" />
                      {pageElements.map((el) => (
                        <div
                          key={el.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, el.id)}
                          onClick={() => setSelectedId(el.id)}
                          style={{
                            position: "absolute", left: el.x, top: el.y,
                            cursor: "move", opacity: el.opacity,
                            outline: selectedId === el.id ? "2px dashed #9333ea" : "none",
                            outlineOffset: 2,
                          }}
                        >
                          {el.type === "text" && <div style={{ color: el.color, fontSize: el.fontSize || 16, whiteSpace: "nowrap" }}>{el.text}</div>}
                          {el.type === "rectangle" && <div style={{ width: el.w, height: el.h, backgroundColor: el.color }} />}
                          {el.type === "line" && <div style={{ width: el.w, height: 2, backgroundColor: el.color }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="flex flex-col items-center py-12 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <PenSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-1">Edits Applied!</h3>
                <p className="text-green-700 dark:text-green-400">Your modified PDF is ready for download.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => saveAs(resultBlob!, `edited_${file?.name || "document.pdf"}`)} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="w-5 h-5" /> Download PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => { setFile(null); setResultBlob(null); setElements([]); }}>Edit Another</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
