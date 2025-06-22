'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApiRoute = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing API route...');
      const response = await fetch('/api/pdf');
      
      console.log('📊 API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('📄 API: Received', arrayBuffer.byteLength, 'bytes');

      // Check PDF header
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, 8));
      const header = String.fromCharCode(...firstBytes);
      console.log('🔍 API: File header:', header);

      setResult({
        success: true,
        size: arrayBuffer.byteLength,
        header: header,
        isPdf: header.startsWith('%PDF'),
        status: response.status
      });

    } catch (error) {
      console.error('❌ API test failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PDF API Test</h1>
      
      <button 
        onClick={testApiRoute}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test API Route'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          {result.success ? (
            <div className="text-sm">
              <div><strong>Status:</strong> {result.status}</div>
              <div><strong>Size:</strong> {result.size} bytes</div>
              <div><strong>Header:</strong> {result.header}</div>
              <div><strong>Is PDF:</strong> {result.isPdf ? '✅ Yes' : '❌ No'}</div>
            </div>
          ) : (
            <div className="text-red-600">
              <strong>Error:</strong> {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 