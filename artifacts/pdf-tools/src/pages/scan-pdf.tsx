import { useState, useRef, useEffect } from "react";
import { Layout } from "./home";
import { Button } from "@/components/ui/button";
import { Camera, X, Download, Plus, Video } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { PDFDocument } from "pdf-lib";

export function ScanPDF() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasCamera(false);
      toast({
        title: "Camera access denied",
        description: "Could not access your camera. You can upload images instead.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImages(prev => [...prev, dataUrl]);
        toast({
          title: "Captured",
          description: `Image ${capturedImages.length + 1} added to scan.`,
        });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setCapturedImages(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (capturedImages.length === 0) return;

    try {
      setIsProcessing(true);
      const pdfDoc = await PDFDocument.create();

      for (const dataUrl of capturedImages) {
        // extract base64 data
        const base64Data = dataUrl.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        let pdfImage;
        if (dataUrl.startsWith("data:image/png")) {
           pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
           pdfImage = await pdfDoc.embedJpg(imageBytes);
        }

        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      setResultBlob(blob);

      stopCamera();

      toast({
        title: "Success!",
        description: "Scans converted to PDF.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while creating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, "scanned_document.pdf");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-slate-100 text-slate-600 rounded-full mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Scan to PDF</h1>
          <p className="text-muted-foreground text-lg">
            Use your camera to scan documents to PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5"/> Camera</h3>
                <div className="bg-black rounded-xl overflow-hidden aspect-[3/4] sm:aspect-video md:aspect-[3/4] relative flex items-center justify-center">
                  {hasCamera ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-center p-6">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Camera not available.</p>
                      <p className="text-sm opacity-70">Use the upload button below to add images manually.</p>
                    </div>
                  )}
                  {hasCamera && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <Button size="lg" className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/40 backdrop-blur border-2 border-white text-white p-0" onClick={captureImage}>
                         <div className="w-12 h-12 bg-white rounded-full" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {!hasCamera && (
                  <div>
                     <input type="file" id="image-upload" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                     <Button variant="outline" className="w-full" onClick={() => document.getElementById('image-upload')?.click()}>
                       <Plus className="w-4 h-4 mr-2" /> Upload Images
                     </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center justify-between">
                  <span>Scanned Pages ({capturedImages.length})</span>
                  {capturedImages.length > 0 && (
                    <Button size="sm" onClick={handleConvert} disabled={isProcessing} className="bg-slate-800 hover:bg-slate-900">
                      {isProcessing ? "Creating PDF..." : "Convert to PDF"}
                    </Button>
                  )}
                </h3>
                
                {capturedImages.length === 0 ? (
                  <div className="h-64 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground bg-muted/20">
                    <p>Capture images to see them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                    {capturedImages.map((src, idx) => (
                      <div key={idx} className="relative group aspect-[3/4] border rounded-lg overflow-hidden bg-muted/20">
                        <img src={src} alt={`Scan ${idx+1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImage(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                          Page {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  PDF Created!
                </h3>
                <p className="text-green-700">
                  Your scanned document is ready.
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
                    setResultBlob(null);
                    setCapturedImages([]);
                    startCamera();
                  }}
                >
                  Scan More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
