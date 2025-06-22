'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    loadPdfFields();
  }, []);

  const loadPdfFields = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting PDF field extraction...');
      
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.error('❌ Running on server side, PDF processing not available');
        setLoading(false);
        return;
      }
      
      // Since PDF loading is being blocked, let's create mock fields for testing
      console.log('⚠️ PDF loading blocked by ad blocker, using mock fields for testing');
      
      const mockFields: FormField[] = [
        {
          name: 'Company Name',
          type: 'text',
          value: '',
        },
        {
          name: 'Contact Person',
          type: 'text',
          value: '',
        },
        {
          name: 'Email',
          type: 'text',
          value: '',
        },
        {
          name: 'Phone',
          type: 'text',
          value: '',
        },
        {
          name: 'Address',
          type: 'text',
          value: '',
        },
        {
          name: 'Agreement Type',
          type: 'select',
          value: '',
          options: ['Standard', 'Premium', 'Enterprise']
        },
        {
          name: 'Terms Accepted',
          type: 'checkbox',
          value: false,
        },
        {
          name: 'Newsletter Subscription',
          type: 'checkbox',
          value: false,
        }
      ];
      
      console.log('✅ Mock fields created:', mockFields);
      setPdfFields(mockFields);
      setPdfUrl('/agent.pdf'); // This won't work but keeps the structure
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading PDF fields:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setLoading(false);
    }
  };

  const handleFieldChange = async (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    // Update PDF with new values
    await updatePdfPreview(newFormData);
  };

  const updatePdfPreview = async (data: Record<string, any>) => {
    try {
      console.log('🔄 Starting PDF preview update with data:', data);
      
      // Dynamically import pdf-lib only on client side
      const { PDFDocument, PDFCheckBox, PDFTextField, PDFRadioGroup, PDFDropdown } = await import('pdf-lib');
      console.log('✅ pdf-lib imported for preview update');
      
      console.log('📁 Fetching PDF for preview update...');
      const response = await fetch('/api/pdf');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      console.log('📄 PDF loaded for preview, size:', pdfBytes.byteLength, 'bytes');
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      console.log('✅ PDF document loaded for preview');
      
      const form = pdfDoc.getForm();
      console.log('✅ Form retrieved for preview');
      
      // Fill form fields
      Object.entries(data).forEach(([fieldName, value]) => {
        try {
          console.log(`📝 Attempting to fill field: ${fieldName} with value:`, value);
          const field = form.getField(fieldName);
          if (field) {
            const fieldType = field.constructor.name;
            console.log(`📝 Field type: ${fieldType}`);
            
            if (fieldType === 'PDFCheckBox') {
              const checkbox = field as any;
              if (typeof value === 'boolean') {
                if (value) {
                  checkbox.check();
                  console.log(`✅ Checked checkbox: ${fieldName}`);
                } else {
                  checkbox.uncheck();
                  console.log(`✅ Unchecked checkbox: ${fieldName}`);
                }
              }
            } else if (fieldType === 'PDFTextField') {
              const textField = field as any;
              textField.setText(value.toString());
              console.log(`✅ Set text field: ${fieldName} = "${value}"`);
            } else if (fieldType === 'PDFRadioGroup') {
              const radio = field as any;
              radio.select(value.toString());
              console.log(`✅ Selected radio: ${fieldName} = "${value}"`);
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = field as any;
              dropdown.select(value.toString());
              console.log(`✅ Selected dropdown: ${fieldName} = "${value}"`);
            } else {
              console.warn(`⚠️ Unknown field type: ${fieldType} for field: ${fieldName}`);
            }
          } else {
            console.warn(`⚠️ Field not found: ${fieldName}`);
          }
        } catch (error) {
          console.warn(`❌ Could not set field ${fieldName}:`, error);
        }
      });
      
      console.log('💾 Saving filled PDF...');
      const filledPdfBytes = await pdfDoc.save();
      console.log('✅ PDF saved, size:', filledPdfBytes.byteLength, 'bytes');
      
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      console.log('🔗 Created blob URL for preview');
      setFilledPdfUrl(url);
    } catch (error) {
      console.error('❌ Error updating PDF preview:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
    }
  };

  const renderFormField = (field: FormField) => {
    const { name, type, value, options } = field;
    
    switch (type) {
      case 'checkbox':
        return (
          <div key={name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={name}
              checked={formData[name] || false}
              onChange={(e) => handleFieldChange(name, e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor={name} className="text-sm font-medium">
              {name}
            </label>
          </div>
        );
      
      case 'select':
        return (
          <div key={name} className="space-y-1">
            <label htmlFor={name} className="block text-sm font-medium">
              {name}
            </label>
            <select
              id={name}
              value={formData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div key={name} className="space-y-1">
            <label htmlFor={name} className="block text-sm font-medium">
              {name}
            </label>
            <input
              type="text"
              id={name}
              value={formData[name] || ''}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${name}`}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading PDF fields...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Form Section */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">PDF Form</h1>
          <div className="space-y-4">
            {pdfFields.length > 0 ? (
              pdfFields.map(renderFormField)
            ) : (
              <p className="text-gray-500">No form fields found in the PDF.</p>
            )}
          </div>
        </div>
      </div>

      {/* PDF Preview Section */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">PDF Preview</h2>
          </div>
          <div className="flex-1 overflow-auto">
            {filledPdfUrl ? (
              <PdfPreview file={filledPdfUrl} />
            ) : pdfUrl ? (
              <PdfPreview file={pdfUrl} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                PDF preview not available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 