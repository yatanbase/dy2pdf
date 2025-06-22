const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createPdfForm() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 1008]);
  const form = pdfDoc.getForm();
  const { width, height } = page.getSize();

  const createTextField = (name, x, y, width, height) => {
    form.createTextField(name, {
      x,
      y,
      width,
      height,
      backgroundColor: rgb(0.98, 0.98, 0.98),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });
  };

  const createRadioGroup = (name, options, positions) => {
    const radioGroup = form.createRadioGroup(name);
    options.forEach((option, i) => {
      radioGroup.addOptionToPage(option, page, {
        ...positions[i],
        width: 15,
        height: 15,
      });
    });
  };

  // Agent A Fields
  createTextField('agent_a_establishment', 50, height - 130, 300, 15);
  createTextField('agent_a_address', 50, height - 160, 300, 15);
  createTextField('agent_a_po_box', 50, height - 190, 300, 15);
  createTextField('agent_a_phone', 50, height - 220, 300, 15);
  createTextField('agent_a_fax', 50, height - 250, 300, 15);
  createTextField('agent_a_email1', 50, height - 280, 300, 15);
  createTextField('agent_a_orn', 50, height - 310, 300, 15);
  createTextField('agent_a_ded_license', 50, height - 340, 300, 15);
  createTextField('agent_a_reg_agent', 50, height - 400, 300, 15);
  createTextField('agent_a_brn', 50, height - 430, 300, 15);
  createTextField('agent_a_date_issued', 50, height - 460, 300, 15);
  createTextField('agent_a_mobile', 50, height - 490, 300, 15);
  createTextField('agent_a_email2', 50, height - 520, 300, 15);

  // Agent B Fields
  createTextField('agent_b_establishment', 400, height - 130, 300, 15);
  createTextField('agent_b_address', 400, height - 160, 300, 15);
  createTextField('agent_b_po_box', 400, height - 190, 300, 15);
  createTextField('agent_b_phone', 400, height - 220, 300, 15);
  createTextField('agent_b_fax', 400, height - 250, 300, 15);
  createTextField('agent_b_email1', 400, height - 280, 300, 15);
  createTextField('agent_b_orn', 400, height - 310, 300, 15);
  createTextField('agent_b_ded_license', 400, height - 340, 300, 15);
  createTextField('agent_b_reg_agent', 400, height - 400, 300, 15);
  createTextField('agent_b_brn', 400, height - 430, 300, 15);
  createTextField('agent_b_date_issued', 400, height - 460, 300, 15);
  createTextField('agent_b_mobile', 400, height - 490, 300, 15);
  createTextField('agent_b_email2', 400, height - 520, 300, 15);

  // Property Fields
  createTextField('property_address', 50, height - 700, 300, 15);
  createTextField('master_developer', 50, height - 730, 300, 15);
  createTextField('master_project', 50, height - 760, 300, 15);
  createTextField('building_name', 50, height - 790, 300, 15);
  createTextField('listed_price', 50, height - 820, 300, 15);

  // Commission Fields
  createRadioGroup('commission_type', ['Buyer', 'Seller', 'Landlord', 'Tenant'], [
    { x: 400, y: height - 670 },
    { x: 480, y: height - 670 },
    { x: 560, y: height - 670 },
    { x: 640, y: height - 670 }
  ]);
  createTextField('commission_agent_a', 400, height - 700, 140, 15);
  createTextField('commission_agent_b', 560, height - 700, 140, 15);
  createTextField('commission_client_name', 400, height - 730, 300, 15);
  createRadioGroup('client_contacted', ['Yes', 'No'], [
    { x: 480, y: height - 790 },
    { x: 640, y: height - 790 }
  ]);

  // Signature Fields
  createTextField('signature_party_a', 50, height - 900, 300, 30);
  createTextField('signature_party_b', 400, height - 900, 300, 30);

  const pdfBytes = await pdfDoc.save();
  const dirPath = path.join(__dirname, '..', 'public', 'files');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'Real_Estate_Form.pdf'), pdfBytes);
  console.log('PDF form created successfully at public/files/Real_Estate_Form.pdf');
}

createPdfForm().catch(err => console.error(err)); 