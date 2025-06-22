'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PdfPreview = dynamic(() => import('../components/PdfPreview'), { ssr: false });

export default function TestPage() {
  const [selectedPdf, setSelectedPdf] = useState<string>('/files/test.pdf');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testPdfLoad = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing PDF load...');
      
      const response = await fetch(selectedPdf);
      
      console.log(`📊 ${selectedPdf} - Status:`, response.status);
      console.log(`📊 ${selectedPdf} - StatusText:`, response.statusText);
      console.log(`📊 ${selectedPdf} - Headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        console.log(`📄 ${selectedPdf} - Size:`, arrayBuffer.byteLength, 'bytes');
        
        if (arrayBuffer.byteLength > 0) {
          setTestResult({
            success: true,
            url: selectedPdf,
            size: arrayBuffer.byteLength,
            status: response.status,
            contentType: response.headers.get('content-type')
          });
        } else {
          setTestResult({
            success: false,
            error: 'Empty file received'
          });
        }
      } else {
        setTestResult({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">PDF Test Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">PDF Loading Test</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF to test:
                </label>
                <select
                  value={selectedPdf}
                  onChange={(e) => setSelectedPdf(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="/files/test.pdf">test.pdf</option>
                  <option value="/files/Real_Estate_Form.pdf">Real_Estate_Form.pdf</option>
                  <option value="/api/pdf">API Route</option>
                </select>
              </div>
              
              <button 
                onClick={testPdfLoad}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Testing...' : 'Test PDF Loading'}
              </button>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <h3 className="font-semibold mb-2">
                    {testResult.success ? '✅ Success!' : '❌ Failed'}
                  </h3>
                  {testResult.success ? (
                    <div className="text-sm space-y-1">
                      <div><strong>URL:</strong> {testResult.url}</div>
                      <div><strong>Size:</strong> {testResult.size} bytes</div>
                      <div><strong>Status:</strong> {testResult.status}</div>
                      <div><strong>Content-Type:</strong> {testResult.contentType}</div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <strong>Error:</strong> {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PDF Preview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">PDF Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Current: {selectedPdf}
              </p>
            </div>
            <div className="h-96">
              <PdfPreview file={selectedPdf} />
            </div>
          </div>
        </div>

        {/* Troubleshooting Info */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>Common Issues:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>IDM (Internet Download Manager) intercepting requests - disable for localhost</li>
              <li>PDF files not found in public/files/ directory</li>
              <li>Browser PDF viewer not supported - use the PDF.js viewer above</li>
              <li>CORS issues with local development</li>
            </ul>
            <p className="mt-3">
              <strong>Solution:</strong> The PDF.js viewer above should work regardless of browser PDF support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 