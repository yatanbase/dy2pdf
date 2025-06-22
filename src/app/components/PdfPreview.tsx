'use client';

import { useState } from 'react';

interface PdfPreviewProps {
  file: string;
}

export default function PdfPreview({ file }: PdfPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="text-gray-700 font-medium">Loading PDF...</div>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="text-center">
            <div className="text-red-600 text-2xl mb-2">⚠️</div>
            <div className="text-red-800 font-semibold">Failed to load PDF</div>
            <div className="text-red-600 text-sm mt-1">Check if the file is accessible</div>
          </div>
        </div>
      )}
      
      <iframe
        src={file}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title="PDF Preview"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
} 