'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PdfPreview = dynamic(() => import('./PdfPreview'), { ssr: false });

export default function PdfViewer() {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState<string[]>([]);

  useEffect(() => {
    loadPdf();
  }, []);

  const loadPdf = async () => {
    setLoading(true);
    setError('');
    setAttempts([]);

    const urls = [
      '/test.pdf',
      '/files/test.pdf', 
      '/files/test.pdf',
      '/api/pdf'
    ];

    for (const url of urls) {
      try {
        setAttempts(prev => [...prev, `Trying ${url}...`]);
        console.log(`🔍 Attempting to load PDF from: ${url}`);
        
        const response = await fetch(url);
        console.log(`📊 Response for ${url}:`, response.status, response.statusText);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          console.log(`📄 Content-Type for ${url}:`, contentType);
          
          if (contentType?.includes('pdf') || contentType?.includes('octet-stream')) {
            setPdfUrl(url);
            setLoading(false);
            setAttempts(prev => [...prev, `✅ Success with ${url}`]);
            console.log(`✅ PDF loaded successfully from ${url}`);
            return;
          } else {
            setAttempts(prev => [...prev, `❌ Wrong content type: ${contentType}`]);
          }
        } else {
          setAttempts(prev => [...prev, `❌ HTTP ${response.status}: ${response.statusText}`]);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setAttempts(prev => [...prev, `❌ Error: ${errorMsg}`]);
        console.error(`❌ Error loading ${url}:`, err);
      }
    }

    setError('All PDF loading attempts failed');
    setLoading(false);
  };

  const retryLoad = () => {
    loadPdf();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">PDF Preview</h2>
          <button
            onClick={retryLoad}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Retry Load
          </button>
        </div>
        
        {loading && (
          <div className="mt-2 text-sm text-gray-600">
            Loading PDF...
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {attempts.length > 0 && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <strong>Loading attempts:</strong>
            <ul className="mt-1 space-y-1">
              {attempts.map((attempt, index) => (
                <li key={index} className={attempt.includes('✅') ? 'text-green-600' : attempt.includes('❌') ? 'text-red-600' : 'text-gray-600'}>
                  {attempt}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-gray-600">Loading PDF...</div>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="h-full">
            <PdfPreview file={pdfUrl} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <div>PDF preview not available</div>
              <div className="text-sm mt-1">Check the loading attempts above for details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 