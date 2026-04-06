import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { Sheet, File, X, Download } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export function ExcelToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  const handleFilesSelected = (newFiles: File[]) => {
    const excelFile = newFiles.find(
      (f) =>
        f.name.toLowerCase().endsWith(".xlsx") ||
        f.name.toLowerCase().endsWith(".xls") ||
        f.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        f.type === "application/vnd.ms-excel"
    );
    if (!excelFile) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx or .xls).",
        variant: "destructive",
      });
      return;
    }
    setFile(excelFile);
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = "-9999px";
      div.style.top = "-9999px";
      div.style.backgroundColor = "white";
      div.style.padding = "20px";
      div.style.color = "black";
      div.style.fontFamily = "sans-serif";
      
      let html = "<table style='border-collapse: collapse; width: 100%;'>";
      data.forEach((row, rowIndex) => {
        html += "<tr>";
        row.forEach((cell) => {
          const cellStr = cell !== undefined && cell !== null ? String(cell) : "";
          const isHeader = rowIndex === 0;
          html += `<${isHeader ? 'th' : 'td'} style='border: 1px solid #ddd; padding: 8px; text-align: left;'>${cellStr}</${isHeader ? 'th' : 'td'}>`;
        });
        html += "</tr>";
      });
      html += "</table>";
      
      div.innerHTML = html;
      document.body.appendChild(div);

      const canvas = await html2canvas(div, { scale: 2 });
      
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
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
        description: "Excel document has been converted to PDF.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      saveAs(resultBlob, `converted_${file?.name.replace(/\.[^/.]+$/, "") || "document"}.pdf`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-600 rounded-full mb-4">
            <Sheet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Excel to PDF</h1>
          <p className="text-muted-foreground text-lg">
            Convert spreadsheets to PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className="w-6 h-6 text-green-600 shrink-0" />
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

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? "Converting..." : "Convert to PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Sheet className="w-8 h-8" />
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
