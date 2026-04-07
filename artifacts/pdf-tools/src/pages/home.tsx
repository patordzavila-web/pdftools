import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  FileStack, Scissors, Archive, ImageDown, Images, RotateCcw, Stamp,
  FileText, Presentation, Table2, FileInput, MonitorPlay, Sheet, Code2,
  PenSquare, PenLine, ShieldCheck, GalleryHorizontal, BadgeCheck, Camera, ScanText,
  Hash, Crop, GitCompare, Languages, Sun, Moon, Clock, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { getRecentFiles, clearRecentFiles, formatFileSize, formatTimeAgo, type RecentFile } from "@/lib/recent-files";
import { HorizontalAd } from "@/components/ad-unit";

export function Layout({ children, title, description }: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const { theme, toggle } = useTheme();

  const pageTitle = title ? `${title} — PDFTOOLS` : "PDFTOOLS — Free Online PDF Tools";
  const pageDesc = description || "Free, secure, browser-based PDF tools. Merge, split, compress, convert, edit, sign, and more. Your files never leave your device.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="min-h-[100dvh] flex flex-col">
        <header className="bg-primary text-primary-foreground py-4 px-6 shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <FileText className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">PDFTOOLS</span>
            </Link>
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full bg-muted/30">
          {children}
          <div className="max-w-4xl mx-auto px-6 pb-8">
            <HorizontalAd className="rounded-xl overflow-hidden" />
          </div>
        </main>

        <footer className="py-6 px-6 text-center text-sm text-muted-foreground border-t border-border bg-background">
          <p>PDFTOOLS &copy; {new Date().getFullYear()} — All processing happens in your browser. Your files never leave your device.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

function RecentFilesSection() {
  const [recent, setRecent] = useState<RecentFile[]>([]);

  useEffect(() => {
    setRecent(getRecentFiles());
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <Clock className="w-5 h-5 text-muted-foreground" /> Recently Used
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => { clearRecentFiles(); setRecent([]); }}
        >
          <X className="w-3 h-3 mr-1" /> Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {recent.map((f, i) => (
          <Link key={i} href={f.toolPath}>
            <div className="flex items-center gap-3 px-4 py-3 bg-card border rounded-xl hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[140px]">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.tool} · {formatFileSize(f.size)} · {formatTimeAgo(f.timestamp)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const categories = [
    {
      name: "Optimize & Organize",
      tools: [
        { title: "Merge PDF", description: "Combine multiple PDFs into one document.", icon: FileStack, href: "/merge", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
        { title: "Split PDF", description: "Extract pages or separate a PDF into multiple files.", icon: Scissors, href: "/split", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
        { title: "Compress PDF", description: "Reduce file size while maintaining quality.", icon: Archive, href: "/compress", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        { title: "Reorder PDF", description: "Drag and drop pages to reorder your PDF.", icon: GalleryHorizontal, href: "/reorder-pdf", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
        { title: "Rotate PDF", description: "Rotate your PDFs the way you need them.", icon: RotateCcw, href: "/rotate", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
        { title: "Add Page Numbers", description: "Stamp numbered pages onto your PDF.", icon: Hash, href: "/page-numbers", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
        { title: "Crop PDF", description: "Trim margins from every page of your PDF.", icon: Crop, href: "/crop-pdf", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
      ]
    },
    {
      name: "Convert from PDF",
      tools: [
        { title: "PDF to Word", description: "Convert PDF to editable Word document.", icon: FileText, href: "/pdf-to-word", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
        { title: "PDF to PowerPoint", description: "Convert PDF pages to PowerPoint slides.", icon: Presentation, href: "/pdf-to-ppt", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
        { title: "PDF to Excel", description: "Extract tables from PDF to spreadsheet.", icon: Table2, href: "/pdf-to-excel", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
        { title: "PDF to Images", description: "Convert each PDF page into high-quality images.", icon: ImageDown, href: "/pdf-to-images", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
      ]
    },
    {
      name: "Convert to PDF",
      tools: [
        { title: "Word to PDF", description: "Convert Word documents to PDF.", icon: FileInput, href: "/word-to-pdf", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30" },
        { title: "PowerPoint to PDF", description: "Convert presentations to PDF.", icon: MonitorPlay, href: "/ppt-to-pdf", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
        { title: "Excel to PDF", description: "Convert spreadsheets to PDF.", icon: Sheet, href: "/excel-to-pdf", color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30" },
        { title: "HTML to PDF", description: "Convert HTML pages to PDF.", icon: Code2, href: "/html-to-pdf", color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
        { title: "Images to PDF", description: "Convert and arrange images into a single PDF.", icon: Images, href: "/images-to-pdf", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
      ]
    },
    {
      name: "Edit & Annotate",
      tools: [
        { title: "Edit PDF", description: "Add text, shapes and lines to any page.", icon: PenSquare, href: "/edit-pdf", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
        { title: "Sign PDF", description: "Draw and place your signature anywhere on the page.", icon: PenLine, href: "/sign-pdf", color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-950/30" },
        { title: "Add Watermark", description: "Stamp text or image over your PDF.", icon: Stamp, href: "/watermark", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
        { title: "Compare PDFs", description: "View two documents side by side.", icon: GitCompare, href: "/compare-pdf", color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-950/30" },
        { title: "Translate PDF", description: "Translate PDF text into another language.", icon: Languages, href: "/translate-pdf", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/30" },
      ]
    },
    {
      name: "Security",
      tools: [
        { title: "Lock / Unlock PDF", description: "Protect or remove password from PDF.", icon: ShieldCheck, href: "/protect-pdf", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800/30" },
      ]
    },
    {
      name: "Advanced Tools",
      tools: [
        { title: "PDF to PDF/A", description: "Convert to the ISO archival PDF standard.", icon: BadgeCheck, href: "/pdf-to-pdfa", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30" },
        { title: "Scan to PDF", description: "Use your camera to scan documents to PDF.", icon: Camera, href: "/scan-pdf", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/30" },
        { title: "OCR PDF", description: "Extract text from scanned PDFs using OCR.", icon: ScanText, href: "/ocr-pdf", color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30" },
      ]
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Every PDF tool you need, in one place
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            100% free and secure. All processing happens directly in your browser — your files never leave your device.
          </p>
        </div>

        <RecentFilesSection />

        <HorizontalAd className="mb-12 rounded-xl overflow-hidden" />

        <div className="space-y-14">
          {categories.map((category, idx) => (
            <div key={category.name}>
              <h2 className="text-2xl font-bold mb-6 text-foreground border-b pb-2">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {category.tools.map((tool) => (
                  <Link key={tool.title} href={tool.href} className="block group">
                    <Card className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/30 bg-card cursor-pointer">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className={`p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-4 ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{tool.title}</h3>
                        <p className="text-muted-foreground text-sm flex-1">{tool.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {idx === 1 && (
                <HorizontalAd className="mt-10 rounded-xl overflow-hidden" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 text-center py-10 border-t">
          <h2 className="text-xl font-semibold mb-2">Why PDFTOOLS?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 max-w-3xl mx-auto text-left">
            {[
              { title: "100% Private", desc: "Files are processed in your browser. Nothing is uploaded to any server." },
              { title: "Always Free", desc: "No account required. No watermarks. No limits on number of uses." },
              { title: "25+ Tools", desc: "Everything you need to work with PDFs, all in one place." },
            ].map(item => (
              <div key={item.title} className="bg-card rounded-xl border p-5">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
