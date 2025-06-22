'use client';

import { useState } from 'react';

export default function TestPdfPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPdfLoad = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing PDF load...');
      
      // Try multiple approaches
      const urls = [
        '/files/test.pdf',
        '/test.pdf',
        '/agent.pdf',
        '/files/agent.pdf'
      ];

      for (const url of urls) {
        try {
          console.log(`📁 Trying: ${url}`);
          const response = await fetch(url);
          
          console.log(`📊 ${url} - Status:`, response.status);
          console.log(`📊 ${url} - StatusText:`, response.statusText);
          console.log(`📊 ${url} - Headers:`, Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            console.log(`📄 ${url} - Size:`, arrayBuffer.byteLength, 'bytes');
            
            if (arrayBuffer.byteLength > 0) {
              setResult({
                success: true,
                url: url,
                size: arrayBuffer.byteLength,
                status: response.status
              });
              return;
            }
          }
        } catch (error) {
          console.log(`❌ ${url} failed:`, error);
        }
      }
      
      setResult({
        success: false,
        error: 'All URLs failed'
      });
      
    } catch (error) {
      console.error('❌ Test failed:', error);
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
      <h1 className="text-2xl font-bold mb-4">PDF Load Test</h1>
      
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Issue:</strong> IDM (Internet Download Manager) is intercepting PDF requests and returning empty responses.
          <br />
          <strong>Solution:</strong> Disable IDM for localhost or use a different port.
        </p>
      </div>
      
      <button 
        onClick={testPdfLoad}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test PDF Loading'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          {result.success ? (
            <div className="text-sm">
              <div><strong>Success!</strong></div>
              <div><strong>URL:</strong> {result.url}</div>
              <div><strong>Size:</strong> {result.size} bytes</div>
              <div><strong>Status:</strong> {result.status}</div>
            </div>
          ) : (
            <div className="text-red-600">
              <strong>Error:</strong> {result.error}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded">
        <h3 className="font-bold mb-2">How to fix IDM issue:</h3>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Open IDM settings</li>
          <li>Go to "Downloads" → "File Types"</li>
          <li>Add <code>localhost:3000</code> to exclusion list</li>
          <li>Or temporarily disable IDM</li>
          <li>Or restart the dev server on a different port: <code>npm run dev -- -p 3001</code></li>
        </ol>
      </div>
    </div>
  );
} 