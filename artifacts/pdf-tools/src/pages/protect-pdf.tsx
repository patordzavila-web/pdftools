import { useState } from "react";
import { Layout } from "./home";
import { FileDropzone } from "@/components/file-dropzone";
import { Button } from "@/components/ui/button";
import { ShieldCheck, File, X, Download, Lock, Unlock } from "lucide-react";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";

export function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"lock" | "unlock">("lock");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
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
    setPassword("");
    setConfirmPassword("");
  };

  const handleProcess = async () => {
    if (!file || !password) return;

    if (mode === "lock" && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();

      if (mode === "lock") {
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pdfBytes = await pdfDoc.save({
          useObjectStreams: false,
          userPassword: password,
          ownerPassword: password,
        });
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        setResultBlob(blob);
        toast({
          title: "Success!",
          description: "PDF has been protected.",
        });
      } else {
        // Unlock
        try {
          const pdfDoc = await PDFDocument.load(arrayBuffer, { password });
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          setResultBlob(blob);
          toast({
            title: "Success!",
            description: "PDF password has been removed.",
          });
        } catch (e: any) {
          throw new Error("Invalid password");
        }
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Processing failed",
        description: error.message === "Invalid password" 
          ? "Incorrect password. Could not unlock the PDF."
          : "An error occurred while processing the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      const prefix = mode === "lock" ? "protected_" : "unlocked_";
      saveAs(resultBlob, `${prefix}${file?.name || "document.pdf"}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${mode === 'lock' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Lock / Unlock PDF</h1>
          <p className="text-muted-foreground text-lg">
            Protect or remove password from PDF.
          </p>
        </div>

        {!resultBlob ? (
          <div className="space-y-6">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "lock"|"unlock")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="lock" className="data-[state=active]:text-green-600">
                  <Lock className="w-4 h-4 mr-2" /> Lock PDF
                </TabsTrigger>
                <TabsTrigger value="unlock" className="data-[state=active]:text-red-600">
                  <Unlock className="w-4 h-4 mr-2" /> Unlock PDF
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {!file ? (
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept=".pdf,application/pdf"
              />
            ) : (
              <div className="space-y-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <File className={`w-6 h-6 shrink-0 ${mode === 'lock' ? 'text-green-500' : 'text-red-500'}`} />
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
                    <Label htmlFor="password">{mode === 'lock' ? 'Set Password' : 'Enter PDF Password'}</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'lock' ? 'Enter a strong password' : 'Enter password to unlock'}
                    />
                  </div>
                  
                  {mode === 'lock' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleProcess}
                    disabled={isProcessing || !password || (mode === 'lock' && !confirmPassword)}
                    className={`w-full sm:w-auto ${mode === 'lock' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isProcessing ? "Processing..." : mode === 'lock' ? "Lock PDF" : "Unlock PDF"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                {mode === "lock" ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  {mode === "lock" ? "PDF Protected!" : "PDF Unlocked!"}
                </h3>
                <p className="text-green-700">
                  {mode === "lock" 
                    ? "Your PDF is now encrypted with the password." 
                    : "The password has been successfully removed from the PDF."}
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
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Process Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
