'use client';

import { useState, useEffect } from 'react';

export default function FileTest() {
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testFileAccess();
  }, []);

  const testFileAccess = async () => {
    try {
      console.log('🧪 Testing file access...');
      
      const response = await fetch('/api/pdf');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('📄 File size:', arrayBuffer.byteLength, 'bytes');

      // Check PDF header
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, 8));
      const header = String.fromCharCode(...firstBytes);
      console.log('🔍 File header:', header);

      setFileInfo({
        size: arrayBuffer.byteLength,
        header: header,
        isPdf: header.startsWith('%PDF'),
        status: response.status
      });

    } catch (err) {
      console.error('❌ File test failed:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">File Access Test</h3>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-semibold mb-1">Error:</div>
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}
      {fileInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold mb-3">✅ Test Results:</div>
          <div className="space-y-2 text-sm text-green-700">
            <div><span className="font-medium">Status:</span> {fileInfo.status}</div>
            <div><span className="font-medium">Size:</span> {fileInfo.size.toLocaleString()} bytes</div>
            <div><span className="font-medium">Header:</span> <code className="bg-green-100 px-2 py-1 rounded">{fileInfo.header}</code></div>
            <div><span className="font-medium">Is PDF:</span> {fileInfo.isPdf ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
      )}
    </div>
  );
} 