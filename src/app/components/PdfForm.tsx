'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [updateKey, setUpdateKey] = useState(0); // Force PDF preview refresh
  const [logoImage, setLogoImage] = useState<{bytes: ArrayBuffer, type: 'image/png' | 'image/jpeg' } | null>(null);

  useEffect(() => {
    loadPdfFields();
  }, []);

  useEffect(() => {
    // When logo is updated, trigger a PDF update.
    // We only want this to run when the logoImage itself changes.
    if (logoImage) {
      updatePdfPreview(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoImage]);

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
      
      // Try multiple PDF sources - prioritize test.pdf
      const pdfSources = [
        '/files/test.pdf',
        '/files/Real_Estate_Form.pdf',
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
      const { PDFDocument, PDFRadioGroup } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Extract form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      console.log(`📝 Found ${fields.length} form fields`);
      
      const fieldsWithCoords = fields.map(field => {
        const widgets = field.acroField.getWidgets();
        let y = Infinity;
        let x = Infinity;

        // Use the first widget's position for sorting
        if (widgets.length > 0) {
            const rect = widgets[0].getRectangle();
            y = rect.y;
            x = rect.x;
        }

        return { field, y, x };
      });

      // Sort fields by position: top-to-bottom, then left-to-right
      // pdf-lib's origin (0,0) is at the bottom-left corner of the page.
      // So we sort by 'y' descending, and then 'x' ascending.
      fieldsWithCoords.sort((a, b) => {
          if (a.y > b.y) return -1;
          if (a.y < b.y) return 1;
          if (a.x < b.x) return -1;
          if (a.x > b.x) return 1;
          return 0;
      });

      const sortedFields = fieldsWithCoords.map(item => item.field);
      const extractedFields: FormField[] = [];
      
      sortedFields.forEach((field) => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        
        let type: FormField['type'] = 'text';
        let options: string[] | undefined;

        if (fieldType.includes('PDFCheckBox')) {
          type = 'checkbox';
        } else if (fieldType.includes('PDFRadioGroup')) {
          type = 'radio';
          options = (field as any).getOptions().map((o: any) => o.toString());
        } else if (fieldType.includes('PDFDropdown')) {
          type = 'select';
          options = (field as any).getOptions().map((o: any) => o.toString());
        }
        
        extractedFields.push({
          name: fieldName,
          type,
          value: type === 'checkbox' ? false : '',
          options
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.type === 'image/png' || file.type === 'image/jpeg') {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setLogoImage({ bytes: event.target.result as ArrayBuffer, type: file.type as 'image/png' | 'image/jpeg' });
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Please select a PNG or JPEG image.');
        }
    }
  };

  const handleFieldChange = async (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    // Only update PDF if we have form fields loaded
    if (pdfFields.length > 0) {
      updatePdfPreview(newFormData);
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
      
      // Try to load the same PDF that was successfully loaded initially
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      
      if (logoImage) {
        let embeddedImage;
        if (logoImage.type === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(logoImage.bytes);
        } else { // jpeg
            embeddedImage = await pdfDoc.embedJpg(logoImage.bytes);
        }
        
        const page = pdfDoc.getPage(0);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        const maxWidth = 150;
        const maxHeight = 50;
        
        const logoDims = embeddedImage.scaleToFit(maxWidth, maxHeight);

        page.drawImage(embeddedImage, {
            x: (pageWidth - logoDims.width)/ 2,
            y: pageHeight - 52 - logoDims.height, // Place near top-center
            width: logoDims.width,
            height: logoDims.height,
        });
      }

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
              if (value) {
                radio.select(value.toString());
              }
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = field as any;
              if (value) {
                dropdown.select(value.toString());
              }
            }
          }
        } catch (error) {
          console.warn(`Could not set field ${fieldName}:`, error);
        }
      });
      
      const filledPdfBytes = await pdfDoc.save();
      
      // Clean up previous blob URL to prevent memory leaks
      setFilledPdfUrl(prevUrl => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      });
      
      // Force PDF preview refresh by updating the key
      setUpdateKey(prev => prev + 1);
      
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
      
      case 'radio':
        return (
          <div key={name} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              {name.replace(/_/g, ' ')}
            </label>
            <div className="flex items-center space-x-4">
              {options?.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="radio"
                    id={`${name}-${option}`}
                    name={name}
                    value={option}
                    checked={formData[name] === option}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor={`${name}-${option}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </div>
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
              <li>Check if Real_Estate_Form.pdf exists in public/files/</li>
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
          <div className="space-y-2 mb-6">
            <label htmlFor="logo-upload" className="block text-sm font-semibold text-gray-800">
                Logo
            </label>
            <input
                type="file"
                id="logo-upload"
                accept="image/png, image/jpeg"
                onChange={handleLogoChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <PdfPreview file={filledPdfUrl || pdfUrl} key={updateKey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 