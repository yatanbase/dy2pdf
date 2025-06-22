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
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-4">PDF API Test</h1>
          
          <button 
            onClick={testApiRoute}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Testing...</span>
              </div>
            ) : (
              'Test API Route'
            )}
          </button>

          {result && (
            <div className="mt-6 p-6 rounded-lg border-2">
              <h2 className="font-bold mb-4 text-lg">Result:</h2>
              {result.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-800 font-semibold mb-3">✅ Test Successful:</div>
                  <div className="space-y-2 text-sm text-green-700">
                    <div><span className="font-medium">Status:</span> {result.status}</div>
                    <div><span className="font-medium">Size:</span> {result.size.toLocaleString()} bytes</div>
                    <div><span className="font-medium">Header:</span> <code className="bg-green-100 px-2 py-1 rounded">{result.header}</code></div>
                    <div><span className="font-medium">Is PDF:</span> {result.isPdf ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800 font-semibold mb-2">❌ Test Failed:</div>
                  <div className="text-red-700">{result.error}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 