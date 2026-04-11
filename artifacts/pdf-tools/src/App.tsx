import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "./components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/home";
import { MergePDF } from "@/pages/merge";
import { SplitPDF } from "@/pages/split";
import { CompressPDF } from "@/pages/compress";
import { PDFToImages } from "@/pages/pdf-to-images";
import { ImagesToPDF } from "@/pages/images-to-pdf";
import { RotatePDF } from "@/pages/rotate";
import { WatermarkPDF } from "@/pages/watermark";
import { PDFToWord } from "@/pages/pdf-to-word";
import { PDFToPPT } from "@/pages/pdf-to-ppt";
import { PDFToExcel } from "@/pages/pdf-to-excel";
import { WordToPDF } from "@/pages/word-to-pdf";
import { ExcelToPDF } from "@/pages/excel-to-pdf";
import { PPTToPDF } from "@/pages/ppt-to-pdf";
import { EditPDF } from "@/pages/edit-pdf";
import { SignPDF } from "@/pages/sign-pdf";
import { HTMLToPDF } from "@/pages/html-to-pdf";
import { ProtectPDF } from "@/pages/protect-pdf";
import { ReorderPDF } from "@/pages/reorder-pdf";
import { PDFtoPDFA } from "@/pages/pdf-to-pdfa";
import { ScanPDF } from "@/pages/scan-pdf";
import { OcrPDF } from "@/pages/ocr-pdf";
import { PageNumbers } from "@/pages/page-numbers";
import { CropPDF } from "@/pages/crop-pdf";
import { ComparePDF } from "@/pages/compare-pdf";
import { TranslatePDF } from "@/pages/translate-pdf";
import { PrivacyPolicy } from "@/pages/privacy-policy";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/merge" component={MergePDF} />
      <Route path="/split" component={SplitPDF} />
      <Route path="/compress" component={CompressPDF} />
      <Route path="/pdf-to-images" component={PDFToImages} />
      <Route path="/images-to-pdf" component={ImagesToPDF} />
      <Route path="/rotate" component={RotatePDF} />
      <Route path="/watermark" component={WatermarkPDF} />
      <Route path="/pdf-to-word" component={PDFToWord} />
      <Route path="/pdf-to-ppt" component={PDFToPPT} />
      <Route path="/pdf-to-excel" component={PDFToExcel} />
      <Route path="/word-to-pdf" component={WordToPDF} />
      <Route path="/excel-to-pdf" component={ExcelToPDF} />
      <Route path="/ppt-to-pdf" component={PPTToPDF} />
      <Route path="/edit-pdf" component={EditPDF} />
      <Route path="/sign-pdf" component={SignPDF} />
      <Route path="/html-to-pdf" component={HTMLToPDF} />
      <Route path="/protect-pdf" component={ProtectPDF} />
      <Route path="/reorder-pdf" component={ReorderPDF} />
      <Route path="/pdf-to-pdfa" component={PDFtoPDFA} />
      <Route path="/scan-pdf" component={ScanPDF} />
      <Route path="/ocr-pdf" component={OcrPDF} />
      <Route path="/page-numbers" component={PageNumbers} />
      <Route path="/crop-pdf" component={CropPDF} />
      <Route path="/compare-pdf" component={ComparePDF} />
      <Route path="/translate-pdf" component={TranslatePDF} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
