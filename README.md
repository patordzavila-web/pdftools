# PDFTOOLS

**Free, secure, browser-based PDF tools.** Merge, split, compress, convert, edit, sign, and more. Your files never leave your device.



## ✨ Features

PDFTOOLS offers 25+ tools organized into categories:

### Optimize & Organize
- **Merge PDF**: Combine multiple PDFs into one document
- **Split PDF**: Extract pages or separate a PDF into multiple files
- **Compress PDF**: Reduce file size while maintaining quality
- **Reorder PDF**: Drag and drop pages to reorder your PDF
- **Rotate PDF**: Rotate your PDFs the way you need them
- **Add Page Numbers**: Stamp numbered pages onto your PDF
- **Crop PDF**: Trim margins from every page of your PDF

### Convert from PDF
- **PDF to Word**: Convert PDF to editable Word document
- **PDF to PowerPoint**: Convert PDF pages to PowerPoint slides
- **PDF to Excel**: Extract tables from PDF to spreadsheet
- **PDF to Images**: Convert each PDF page into high-quality images

### Convert to PDF
- **Word to PDF**: Convert Word documents to PDF
- **PowerPoint to PDF**: Convert presentations to PDF
- **Excel to PDF**: Convert spreadsheets to PDF
- **HTML to PDF**: Convert HTML pages to PDF
- **Images to PDF**: Convert and arrange images into a single PDF

### Edit & Annotate
- **Edit PDF**: Add text, shapes and lines to any page
- **Sign PDF**: Draw and place your signature anywhere on the page
- **Add Watermark**: Stamp text or image over your PDF
- **Compare PDFs**: View two documents side by side
- **Translate PDF**: Translate PDF text into another language

### Security
- **Lock / Unlock PDF**: Protect or remove password from PDF

### Advanced Tools
- **PDF to PDF/A**: Convert to the ISO archival PDF standard
- **Scan to PDF**: Use your camera to scan documents to PDF
- **OCR PDF**: Extract text from scanned PDFs using OCR

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI components
- **Routing**: Wouter
- **State Management**: TanStack Query
- **PDF Processing**: pdf-lib, pdfjs-dist, jspdf, tesseract.js, mammoth, pptxgenjs, xlsx
- **Build Tool**: Vite with React plugin
- **Package Manager**: pnpm (monorepo)
- **Deployment**: Replit-ready

## 📁 Project Structure

This is a pnpm monorepo:

```
PDFTOOLS/
├── package.json                 # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── tsconfig.base.json          # Base TypeScript config
├── artifacts/
│   └── pdf-tools/              # Main React app
│       ├── src/
│       │   ├── main.tsx        # App entry point
│       │   ├── App.tsx         # Router and providers
│       │   ├── pages/          # Tool pages (merge.tsx, etc.)
│       │   ├── components/     # Reusable UI components
│       │   └── lib/            # Utilities (recent files, etc.)
│       ├── vite.config.ts      # Vite config
│       └── package.json        # App dependencies
├── lib/
│   ├── api-client-react/       # Generated API client
│   ├── api-spec/               # OpenAPI spec
│   ├── api-zod/                # Zod schemas
│   └── db/                     # Database schema
└── scripts/                    # Build scripts
```

## 🚀 Installation

1. **Prerequisites**:
   - Node.js 18+
   - pnpm

2. **Clone and install**:
   ```bash
   git clone https://github.com/patordzavila-web/pdftools.git
   cd pdftools
   pnpm install
   ```

## 🏃 Development

Start the development server:

```bash
cd artifacts/pdf-tools
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗 Build

Build for production:

```bash
pnpm build
```

Serve the built app:

```bash
pnpm serve
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add your feature'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### Adding a New Tool

1. Create a new page in `src/pages/your-tool.tsx`
2. Add the route in `src/App.tsx`
3. Add the tool to the categories in `src/pages/home.tsx`
4. Test the tool with sample files

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔒 Privacy

- All PDF processing happens locally in your browser
- Files are never uploaded to any server
- No account required
- 100% free and open source

## 🙏 Acknowledgments

Built with:
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) for components

---

**Made with ❤️ for the open source community** 
