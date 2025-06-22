'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfPreviewProps {
  file: string;
}

export default function PdfPreview({ file }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (!file) {
      setLoading(false);
      setError('No PDF file provided');
      return;
    }

    loadPdf();
  }, [file]);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker path
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      // Load the PDF
      const loadingTask = pdfjsLib.getDocument(file);
      const pdf = await loadingTask.promise;
      
      setTotalPages(pdf.numPages);
      
      // Render first page
      await renderPage(pdf, 1);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      setLoading(false);
    }
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page');
    }
  };

  const changePage = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    setLoading(true);
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument(file);
      const pdf = await loadingTask.promise;
      await renderPage(pdf, newPage);
    } catch (err) {
      console.error('Error changing page:', err);
    } finally {
      setLoading(false);
    }
  };

  const changeScale = async (newScale: number) => {
    setScale(newScale);
    setLoading(true);
    
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const loadingTask = pdfjsLib.getDocument(file);
      const pdf = await loadingTask.promise;
      await renderPage(pdf, currentPage);
    } catch (err) {
      console.error('Error changing scale:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading PDF...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">⚠️</div>
          <div className="text-red-800 font-semibold">PDF Loading Error</div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={loadPdf}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeScale(scale - 0.2)}
            disabled={scale <= 0.5}
            className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            -
          </button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeScale(scale + 0.2)}
            disabled={scale >= 3}
            className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="shadow-lg border border-gray-200 bg-white"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
} 