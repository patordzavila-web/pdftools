import { useState, useRef, useEffect } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { PenSquare, File, X, Download, Type, Square, Minus, Trash2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

type ElementType = "text" | "rectangle" | "line";

interface EditorElement {
  id: string;
  type: ElementType;
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
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [textInput, setTextInput] = useState("New Text");
  const [colorInput, setColorInput] = useState("#000000");
  const [fontSizeInput, setFontSizeInput] = useState("16");
  const [opacityInput, setOpacityInput] = useState([1]);
  
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
    setElements([]);
    setSelectedId(null);
  };

  useEffect(() => {
    if (file && canvasRef.current) {
      const renderPdf = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const context = canvas.getContext("2d");
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          setCanvasDimensions({ width: viewport.width, height: viewport.height });
          setPageDimensions({ width: viewport.width / 1.5, height: viewport.height / 1.5 }); // rough estimate of actual PDF points

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
        } catch (error) {
          console.error("Error rendering PDF:", error);
        }
      };

      renderPdf();
    }
  }, [file]);

  const addElement = (type: ElementType) => {
    const newElement: EditorElement = {
      id: Math.random().toString(36).substring(7),
      type,
      x: canvasDimensions.width / 2 - 50,
      y: canvasDimensions.height / 2 - 20,
      w: type === "rectangle" ? 100 : type === "line" ? 150 : undefined,
      h: type === "rectangle" ? 60 : type === "line" ? 2 : undefined,
      text: type === "text" ? textInput : undefined,
      color: colorInput,
      opacity: opacityInput[0],
      fontSize: type === "text" ? parseInt(fontSizeInput) : undefined,
    };
    
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleApplyAndDownload = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const page = pages[0]; // Apply to first page only
      
      const { width: pdfWidth, height: pdfHeight } = page.getSize();

      for (const el of elements) {
        // Convert canvas coordinates to PDF coordinates
        // PDF origin is bottom-left, canvas is top-left
        const pdfX = (el.x / canvasDimensions.width) * pdfWidth;
        const pdfY = pdfHeight - ((el.y / canvasDimensions.height) * pdfHeight);
        
        const color = hexToRgb(el.color);
        const pdfColor = rgb(color.r, color.g, color.b);
        
        if (el.type === "text" && el.text) {
          const fontSize = el.fontSize ? (el.fontSize / canvasDimensions.height) * pdfHeight : 16;
          page.drawText(el.text, {
            x: pdfX,
            y: pdfY - fontSize, // Adjust for baseline
            size: fontSize,
            color: pdfColor,
            opacity: el.opacity,
          });
        } else if (el.type === "rectangle" && el.w && el.h) {
          const pdfW = (el.w / canvasDimensions.width) * pdfWidth;
          const pdfH = (el.h / canvasDimensions.height) * pdfHeight;
          page.drawRectangle({
            x: pdfX,
            y: pdfY - pdfH, // PDF rect draws up from bottom-left
            width: pdfW,
            height: pdfH,
            color: pdfColor,
            opacity: el.opacity,
          });
        } else if (el.type === "line" && el.w && el.h) {
           const pdfW = (el.w / canvasDimensions.width) * pdfWidth;
           const pdfH = (el.h / canvasDimensions.height) * pdfHeight;
           page.drawLine({
             start: { x: pdfX, y: pdfY },
             end: { x: pdfX + pdfW, y: pdfY + pdfH },
             thickness: 2,
             color: pdfColor,
             opacity: el.opacity,
           });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);

      toast({
        title: "Success!",
        description: "Changes applied to PDF.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: "An error occurred while applying changes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `edited_${file?.name || "document.pdf"}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    e.dataTransfer.setData("offsetX", (e.clientX - rect.left).toString());
    e.dataTransfer.setData("offsetY", (e.clientY - rect.top).toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const id = e.dataTransfer.getData("text/plain");
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX"));
    const offsetY = parseFloat(e.dataTransfer.getData("offsetY"));
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const newX = e.clientX - containerRect.left - offsetX;
    const newY = e.clientY - containerRect.top - offsetY;
    
    setElements(elements.map(el => 
      el.id === id ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) } : el
    ));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-600 rounded-full mb-4">
            <PenSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Edit PDF</h1>
          <p className="text-muted-foreground text-lg">
            Add text, shapes and lines to your PDF. (Edits first page only)
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-semibold border-b pb-2">Tools</h3>
                    
                    <div className="space-y-2">
                      <Label>Text to add</Label>
                      <Input value={textInput} onChange={e => setTextInput(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} className="h-10 px-1 py-1" />
                      </div>
                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input type="number" value={fontSizeInput} onChange={e => setFontSizeInput(e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="space-y-2 pb-2">
                      <Label>Opacity: {opacityInput[0]}</Label>
                      <Slider value={opacityInput} min={0.1} max={1} step={0.1} onValueChange={setOpacityInput} />
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2 border-t">
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
                  
                  <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-semibold border-b pb-2">Elements</h3>
                    {elements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No elements added yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {elements.map((el, i) => (
                          <div 
                            key={el.id} 
                            className={`flex items-center justify-between p-2 rounded-md border text-sm ${selectedId === el.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-border'}`}
                            onClick={() => setSelectedId(el.id)}
                          >
                            <span className="truncate max-w-[120px]">
                              {el.type === "text" ? `Text: ${el.text}` : `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${i+1}`}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={handleApplyAndDownload}
                    disabled={isProcessing || elements.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isProcessing ? "Applying..." : "Apply & Download"}
                  </Button>
                  
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => setFile(null)}>
                    Cancel
                  </Button>
                </div>
                
                <div className="lg:col-span-3 bg-muted/30 rounded-xl border flex justify-center overflow-auto p-4 max-h-[800px]">
                  <div 
                    ref={containerRef}
                    className="relative bg-white shadow-sm ring-1 ring-border"
                    style={{ 
                      width: canvasDimensions.width || 'auto', 
                      height: canvasDimensions.height || 'auto' 
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <canvas ref={canvasRef} className="max-w-full block" />
                    
                    {elements.map((el) => (
                      <div
                        key={el.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, el.id)}
                        onClick={() => setSelectedId(el.id)}
                        style={{
                          position: 'absolute',
                          left: `${el.x}px`,
                          top: `${el.y}px`,
                          cursor: 'move',
                          opacity: el.opacity,
                          outline: selectedId === el.id ? '2px dashed #9333ea' : 'none',
                          outlineOffset: '2px',
                        }}
                      >
                        {el.type === "text" && (
                          <div style={{ color: el.color, fontSize: `${el.fontSize || 16}px`, whiteSpace: 'nowrap' }}>
                            {el.text}
                          </div>
                        )}
                        {el.type === "rectangle" && (
                          <div style={{ width: `${el.w}px`, height: `${el.h}px`, backgroundColor: el.color }} />
                        )}
                        {el.type === "line" && (
                          <div style={{ width: `${el.w}px`, height: `${el.h}px`, backgroundColor: el.color }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <PenSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Edits Applied!
                </h3>
                <p className="text-green-700">
                  Your modified PDF is ready for download.
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
                    setElements([]);
                  }}
                >
                  Edit Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
