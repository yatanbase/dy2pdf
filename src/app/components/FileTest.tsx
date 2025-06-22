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
      console.log('📊 Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

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
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">File Access Test</h3>
      {error && (
        <div className="text-red-600 mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}
      {fileInfo && (
        <div className="text-sm">
          <div><strong>Status:</strong> {fileInfo.status}</div>
          <div><strong>Size:</strong> {fileInfo.size} bytes</div>
          <div><strong>Header:</strong> {fileInfo.header}</div>
          <div><strong>Is PDF:</strong> {fileInfo.isPdf ? '✅ Yes' : '❌ No'}</div>
        </div>
      )}
    </div>
  );
} 