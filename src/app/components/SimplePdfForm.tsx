'use client';

import { useState } from 'react';

interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  value: string | boolean;
  options?: string[];
}

export default function SimplePdfForm() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Mock form fields for testing
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

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    console.log('📝 Form data updated:', newFormData);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Form Section */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">PDF Form (Mock Data)</h1>
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Using mock form fields due to PDF loading restrictions. 
              This demonstrates the form functionality without external PDF dependencies.
            </p>
          </div>
          <div className="space-y-4">
            {mockFields.map(renderFormField)}
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Current Form Data:</h3>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="w-1/2 bg-white border-l border-gray-200">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Form Preview</h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Filled Form Preview</h3>
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <span className="font-medium">{key}:</span>{' '}
                  <span className="text-gray-600">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '(empty)'}
                  </span>
                </div>
              ))}
              {Object.keys(formData).length === 0 && (
                <p className="text-gray-500">No data entered yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 