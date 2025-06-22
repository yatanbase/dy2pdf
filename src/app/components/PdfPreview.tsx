'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  file: string;
}

export default function PdfPreview({ file }: PdfPreviewProps) {
  return (
    <Document file={file} className="h-full">
      <Page pageNumber={1} width={500} />
    </Document>
  );
} 