import { useState, useRef } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Code2, Download, RefreshCw } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export function HTMLToPDF() {
  const [htmlContent, setHtmlContent] = useState(
    "<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>\n<p style='color: blue;'>You can paste your HTML here or upload a .html file.</p>"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [previewKey, setPreviewKey] = useState(0); // to force iframe refresh
  
  const { toast } = useToast();

  const handleFilesSelected = async (newFiles: File[]) => {
    const htmlFile = newFiles.find(
      (f) => f.name.toLowerCase().endsWith(".html") || f.type === "text/html"
    );
    if (!htmlFile) {
      toast({
        title: "Invalid file type",
        description: "Please select an HTML file (.html).",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const text = await htmlFile.text();
      setHtmlContent(text);
      setPreviewKey(prev => prev + 1);
      toast({
        title: "File loaded",
        description: "HTML content has been loaded.",
      });
    } catch (e) {
      toast({
        title: "Read error",
        description: "Could not read the HTML file.",
        variant: "destructive",
      });
    }
  };

  const handleConvert = async () => {
    if (!htmlContent.trim()) return;

    try {
      setIsProcessing(true);
      
      // Create a hidden div to render the HTML
      const div = document.createElement("div");
      div.innerHTML = htmlContent;
      div.style.position = "absolute";
      div.style.left = "-9999px";
      div.style.top = "-9999px";
      div.style.width = "800px"; // Fixed width for A4 roughly
      div.style.backgroundColor = "white";
      div.style.padding = "40px";
      div.style.color = "black";
      document.body.appendChild(div);

      // Wait a moment for images to load if there are any
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(div, { scale: 1.5, useCORS: true });
      
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output("blob");
      setResultBlob(pdfBlob);
      
      document.body.removeChild(div);

      toast({
        title: "Success!",
        description: "HTML has been converted to PDF.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the HTML.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `converted_html.pdf`);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-teal-100 text-teal-600 rounded-full mb-4">
            <Code2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">HTML to PDF</h1>
          <p className="text-muted-foreground text-lg">
            Convert HTML code or pages to PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="paste">Paste HTML Code</TabsTrigger>
                <TabsTrigger value="upload">Upload HTML File</TabsTrigger>
              </TabsList>
              
              <TabsContent value="paste" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">HTML Code</label>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewKey(k => k + 1)} className="h-8">
                        <RefreshCw className="w-3 h-3 mr-2" /> Refresh Preview
                      </Button>
                    </div>
                    <Textarea 
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="font-mono text-sm min-h-[400px] resize-y"
                      placeholder="Paste your HTML code here..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Live Preview</label>
                    <div className="border rounded-md bg-white w-full h-[400px] overflow-hidden">
                      <iframe 
                        key={previewKey}
                        srcDoc={htmlContent} 
                        className="w-full h-full border-0" 
                        title="HTML Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="upload">
                <FileDropzone
                  onFilesSelected={handleFilesSelected}
                  accept=".html,text/html"
                />
                {htmlContent && htmlContent !== "<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>\n<p style='color: blue;'>You can paste your HTML here or upload a .html file.</p>" && (
                   <div className="mt-6">
                     <p className="text-sm text-muted-foreground mb-4 text-center">File loaded successfully. Switch to 'Paste HTML Code' tab to preview and edit.</p>
                   </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="pt-6 flex justify-center border-t">
              <Button
                size="lg"
                onClick={handleConvert}
                disabled={isProcessing || !htmlContent.trim()}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 min-w-[200px]"
              >
                {isProcessing ? "Converting..." : "Convert to PDF"}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Code2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-green-700">
                  Your PDF is ready for download.
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
