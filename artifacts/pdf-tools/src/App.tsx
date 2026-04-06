import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/home";
import { MergePDF } from "@/pages/merge";
import { SplitPDF } from "@/pages/split";
import { CompressPDF } from "@/pages/compress";
import { PDFToImages } from "@/pages/pdf-to-images";
import { ImagesToPDF } from "@/pages/images-to-pdf";
import { RotatePDF } from "@/pages/rotate";
import { WatermarkPDF } from "@/pages/watermark";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;