'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';

const PdfPreview = dynamic(() => import('./PdfPreview'), { ssr: false });

interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  value: string | boolean;
  options?: string[];
}

export default function PdfForm() {
  const [pdfFields, setPdfFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [filledPdfUrl, setFilledPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPdf, setUpdatingPdf] = useState(false);

  useEffect(() => {
    loadPdfFields();
  }, []);

  // Cleanup effect to dispose of blob URLs
  useEffect(() => {
    return () => {
      if (filledPdfUrl) {
        URL.revokeObjectURL(filledPdfUrl);
      }
    };
  }, [filledPdfUrl]);

  const loadPdfFields = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        throw new Error('Running on server side, PDF processing not available');
      }
      
      // Try multiple PDF sources
      const pdfSources = [
        '/files/test.pdf',
        '/test.pdf',
        '/api/pdf'
      ];
      
      let pdfBytes: ArrayBuffer | null = null;
      let successfulSource = '';
      
      for (const source of pdfSources) {
        try {
          console.log(`🔍 Trying PDF source: ${source}`);
          const response = await fetch(source);
          
          console.log(`📊 ${source} - Status: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            console.log(`❌ ${source} - HTTP error: ${response.status}`);
            continue;
          }
          
          const buffer = await response.arrayBuffer();
          console.log(`📄 ${source} - Size: ${buffer.byteLength} bytes`);
          
          if (buffer.byteLength === 0) {
            console.log(`❌ ${source} - Empty file`);
            continue;
          }
          
          // Verify PDF header
          const firstBytes = new Uint8Array(buffer.slice(0, 4));
          const pdfHeader = String.fromCharCode(...firstBytes);
          console.log(`🔍 ${source} - Header: ${pdfHeader}`);
          
          if (pdfHeader !== '%PDF') {
            console.log(`❌ ${source} - Invalid PDF header`);
            continue;
          }
          
          pdfBytes = buffer;
          successfulSource = source;
          console.log(`✅ Successfully loaded PDF from: ${source}`);
          break;
          
        } catch (sourceError) {
          console.log(`❌ ${source} - Error:`, sourceError);
          continue;
        }
      }
      
      if (!pdfBytes) {
        throw new Error('Failed to load PDF from any source. Check if test.pdf exists in public/files/');
      }
      
      // Load PDF with pdf-lib
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Extract form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      console.log(`📝 Found ${fields.length} form fields`);
      
      const extractedFields: FormField[] = [];
      
      fields.forEach((field, index) => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name.toLowerCase();
        
        let type: FormField['type'] = 'text';
        if (fieldType.includes('checkbox')) type = 'checkbox';
        else if (fieldType.includes('radio')) type = 'radio';
        else if (fieldType.includes('dropdown')) type = 'select';
        
        extractedFields.push({
          name: fieldName,
          type,
          value: type === 'checkbox' ? false : '',
          options: type === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
        });
      });
      
      setPdfFields(extractedFields);
      setPdfUrl(successfulSource);
      setLoading(false);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ PDF loading failed:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Debounced PDF update function
  const debouncedUpdatePdf = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      let isFirstUpdate = true;
      return (data: Record<string, any>) => {
        clearTimeout(timeoutId);
        const delay = isFirstUpdate ? 1000 : 500; // Longer delay for first update
        timeoutId = setTimeout(() => {
          updatePdfPreview(data);
          isFirstUpdate = false;
        }, delay);
      };
    })(),
    []
  );

  const handleFieldChange = async (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    // Only update PDF if we have form fields loaded
    if (pdfFields.length > 0) {
      // Use debounced update to prevent too many PDF updates
      debouncedUpdatePdf(newFormData);
    }
  };

  const updatePdfPreview = async (data: Record<string, any>) => {
    if (updatingPdf) {
      console.log('⏳ PDF update already in progress, skipping...');
      return;
    }

    try {
      setUpdatingPdf(true);
      
      // Dynamically import pdf-lib only on client side
      const { PDFDocument } = await import('pdf-lib');
      
      const response = await fetch('/files/test.pdf');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      
      // Fill form fields
      Object.entries(data).forEach(([fieldName, value]) => {
        try {
          const field = form.getField(fieldName);
          if (field) {
            const fieldType = field.constructor.name;
            
            if (fieldType === 'PDFCheckBox') {
              const checkbox = field as any;
              if (typeof value === 'boolean') {
                if (value) {
                  checkbox.check();
                } else {
                  checkbox.uncheck();
                }
              }
            } else if (fieldType === 'PDFTextField') {
              const textField = field as any;
              textField.setText(value.toString());
            } else if (fieldType === 'PDFRadioGroup') {
              const radio = field as any;
              radio.select(value.toString());
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = field as any;
              dropdown.select(value.toString());
            }
          }
        } catch (error) {
          console.warn(`Could not set field ${fieldName}:`, error);
        }
      });
      
      const filledPdfBytes = await pdfDoc.save();
      
      // Clean up previous blob URL to prevent memory leaks
      if (filledPdfUrl) {
        URL.revokeObjectURL(filledPdfUrl);
      }
      
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setFilledPdfUrl(url);
      
    } catch (error) {
      console.error('Error updating PDF preview:', error);
    } finally {
      setUpdatingPdf(false);
    }
  };

  const renderFormField = (field: FormField) => {
    const { name, type, value, options } = field;
    
    switch (type) {
      case 'checkbox':
        return (
          <div key={name} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              id={name}
              checked={formData[name] || false}
              onChange={(e) => handleFieldChange(name, e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <label htmlFor={name} className="text-sm font-semibold text-gray-800 cursor-pointer">
              {name}
            </label>
          </div>
        );
      
      case 'select':
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
              {name}
            </label>
            <select
              id={name}
              value={formData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-colors"
            >
              <option value="">Select an option</option>
              {options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return (
          <div key={name} className="space-y-2">
            <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
              {name}
            </label>
            <input
              type="text"
              id={name}
              value={formData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-colors placeholder-gray-500"
              placeholder={`Enter ${name}`}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white text-lg font-medium">Loading PDF fields...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-xl p-8">
          <div className="text-red-600 mb-6">
            <h2 className="text-2xl font-bold mb-3">Failed to Load PDF</h2>
            <p className="text-gray-700">{error}</p>
          </div>
          <div className="space-y-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Check if test.pdf exists in public/files/</li>
              <li>Ensure the PDF file is not corrupted</li>
              <li>Try refreshing the page</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          <button 
            onClick={loadPdfFields}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            Retry Loading PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Form Section */}
      <div className="w-1/2 p-8 overflow-y-auto bg-white shadow-lg">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-200 pb-4">PDF Form</h1>
          <div className="space-y-6">
            {pdfFields.length > 0 ? (
              pdfFields.map(renderFormField)
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No form fields found in the PDF.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Section */}
      <div className="w-1/2 bg-white border-l-2 border-gray-200 shadow-xl">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">PDF Preview</h2>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            {filledPdfUrl ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <PdfPreview file={filledPdfUrl} />
              </div>
            ) : pdfUrl ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <PdfPreview file={pdfUrl} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 bg-white rounded-lg shadow-md">
                <div className="text-center">
                  <div className="text-lg font-medium">PDF preview not available</div>
                  <div className="text-sm mt-2">Fill out the form to see the preview</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 