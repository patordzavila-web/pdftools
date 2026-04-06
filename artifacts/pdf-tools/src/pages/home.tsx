import { Link } from "wouter";
import { 
  FileStack, 
  Scissors, 
  Archive, 
  ImageDown, 
  Images, 
  RotateCcw, 
  Stamp,
  FileText,
  Presentation,
  Table2,
  FileInput,
  MonitorPlay,
  Sheet,
  Code2,
  PenSquare,
  PenLine,
  ShieldCheck,
  GalleryHorizontal,
  BadgeCheck,
  Camera,
  ScanText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <FileText className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">PDFTOOLS</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 w-full bg-muted/30">
        {children}
      </main>

      <footer className="py-6 px-6 text-center text-sm text-muted-foreground border-t border-border bg-background">
        <p>PDFTOOLS &copy; {new Date().getFullYear()} — Client-side PDF processing</p>
      </footer>
    </div>
  );
}

export function Home() {
  const categories = [
    {
      name: "Optimize & Organize",
      tools: [
        { title: "Merge PDF", description: "Combine multiple PDFs into one unified document.", icon: FileStack, href: "/merge", color: "text-blue-500", bg: "bg-blue-50" },
        { title: "Split PDF", description: "Extract pages or separate a PDF into multiple files.", icon: Scissors, href: "/split", color: "text-rose-500", bg: "bg-rose-50" },
        { title: "Compress PDF", description: "Reduce file size while maintaining document quality.", icon: Archive, href: "/compress", color: "text-emerald-500", bg: "bg-emerald-50" },
        { title: "Reorder PDF", description: "Drag and drop pages to reorder your PDF.", icon: GalleryHorizontal, href: "/reorder-pdf", color: "text-violet-500", bg: "bg-violet-50" },
        { title: "Rotate PDF", description: "Rotate your PDFs the way you need them.", icon: RotateCcw, href: "/rotate", color: "text-indigo-500", bg: "bg-indigo-50" },
      ]
    },
    {
      name: "Convert from PDF",
      tools: [
        { title: "PDF to Word", description: "Convert PDF to editable Word document.", icon: FileText, href: "/pdf-to-word", color: "text-blue-500", bg: "bg-blue-50" },
        { title: "PDF to PowerPoint", description: "Convert PDF pages to PowerPoint slides.", icon: Presentation, href: "/pdf-to-ppt", color: "text-orange-500", bg: "bg-orange-50" },
        { title: "PDF to Excel", description: "Extract tables from PDF to spreadsheet.", icon: Table2, href: "/pdf-to-excel", color: "text-green-500", bg: "bg-green-50" },
        { title: "PDF to Images", description: "Convert each page of your PDF into high-quality images.", icon: ImageDown, href: "/pdf-to-images", color: "text-amber-500", bg: "bg-amber-50" },
      ]
    },
    {
      name: "Convert to PDF",
      tools: [
        { title: "Word to PDF", description: "Convert Word documents to PDF.", icon: FileInput, href: "/word-to-pdf", color: "text-blue-600", bg: "bg-blue-100" },
        { title: "PowerPoint to PDF", description: "Convert presentations to PDF.", icon: MonitorPlay, href: "/ppt-to-pdf", color: "text-red-500", bg: "bg-red-50" },
        { title: "Excel to PDF", description: "Convert spreadsheets to PDF.", icon: Sheet, href: "/excel-to-pdf", color: "text-green-600", bg: "bg-green-100" },
        { title: "HTML to PDF", description: "Convert HTML pages to PDF.", icon: Code2, href: "/html-to-pdf", color: "text-teal-500", bg: "bg-teal-50" },
        { title: "Images to PDF", description: "Convert and arrange your images into a single PDF.", icon: Images, href: "/images-to-pdf", color: "text-violet-500", bg: "bg-violet-50" },
      ]
    },
    {
      name: "Edit & Annotate",
      tools: [
        { title: "Edit PDF", description: "Add text, shapes and images to your PDF.", icon: PenSquare, href: "/edit-pdf", color: "text-purple-500", bg: "bg-purple-50" },
        { title: "Sign PDF", description: "Draw and embed your signature in a PDF.", icon: PenLine, href: "/sign-pdf", color: "text-indigo-600", bg: "bg-indigo-100" },
        { title: "Add Watermark", description: "Stamp an image or text over your PDF in seconds.", icon: Stamp, href: "/watermark", color: "text-cyan-500", bg: "bg-cyan-50" },
      ]
    },
    {
      name: "Security",
      tools: [
        { title: "Lock / Unlock PDF", description: "Protect or remove password from PDF.", icon: ShieldCheck, href: "/protect-pdf", color: "text-slate-600", bg: "bg-slate-100" },
      ]
    },
    {
      name: "Advanced Tools",
      tools: [
        { title: "PDF to PDF/A", description: "Convert to the ISO archival PDF standard.", icon: BadgeCheck, href: "/pdf-to-pdfa", color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Scan to PDF", description: "Use your camera to scan documents to PDF.", icon: Camera, href: "/scan-pdf", color: "text-slate-500", bg: "bg-slate-50" },
        { title: "OCR PDF", description: "Extract text from scanned PDFs using OCR.", icon: ScanText, href: "/ocr-pdf", color: "text-sky-500", bg: "bg-sky-50" },
      ]
    }
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Every tool you need to work with PDFs in one place</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            100% free, secure, and fast. All processing happens directly in your browser, so your files never leave your device.
          </p>
        </div>

        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category.name}>
              <h2 className="text-2xl font-bold mb-6 text-foreground border-b pb-2">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {category.tools.map((tool) => (
                  <Link key={tool.title} href={tool.href} className="block group">
                    <Card className="h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/30 bg-card cursor-pointer">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className={`p-4 rounded-xl w-14 h-14 flex items-center justify-center mb-4 ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{tool.title}</h3>
                        <p className="text-muted-foreground text-sm flex-1">{tool.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
