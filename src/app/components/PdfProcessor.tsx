'use client';

import { PDFDocument, PDFForm, PDFField, PDFCheckBox, PDFTextField, PDFRadioGroup, PDFDropdown } from 'pdf-lib';

export interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  value: string | boolean;
  options?: string[];
}

export class PdfProcessor {
  static async extractFields(): Promise<FormField[]> {
    try {
      const response = await fetch('/files/agent.pdf');
      const pdfBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const extractedFields: FormField[] = [];
      
      fields.forEach((field) => {
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
      
      return extractedFields;
    } catch (error) {
      console.error('Error extracting PDF fields:', error);
      return [];
    }
  }

  static async fillPdf(data: Record<string, any>): Promise<string> {
    try {
      const response = await fetch('/files/Agent to Agent.pdf');
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
              const checkbox = field as PDFCheckBox;
              if (typeof value === 'boolean') {
                if (value) checkbox.check();
                else checkbox.uncheck();
              }
            } else if (fieldType === 'PDFTextField') {
              const textField = field as PDFTextField;
              textField.setText(value.toString());
            } else if (fieldType === 'PDFRadioGroup') {
              const radio = field as PDFRadioGroup;
              radio.select(value.toString());
            } else if (fieldType === 'PDFDropdown') {
              const dropdown = field as PDFDropdown;
              dropdown.select(value.toString());
            }
          }
        } catch (error) {
          console.warn(`Could not set field ${fieldName}:`, error);
        }
      });
      
      const filledPdfBytes = await pdfDoc.save();
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error filling PDF:', error);
      throw error;
    }
  }
} 