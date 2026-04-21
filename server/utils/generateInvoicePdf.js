const PDFDocument = require('pdfkit');

function generateInvoicePdf(payment, user, callback) {
  const doc = new PDFDocument({ margin: 44, size: 'A4' });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    callback(pdfData);
  });

  const invoiceDate = new Date();
  const dueDate = new Date(payment.dueDate);
  const safeAmount = Number(payment.amount || 0);
  const invoiceNo = `INV-${String(payment._id).slice(-8).toUpperCase()}`;
  const primaryColor = '#1E3A8A';
  const mutedColor = '#6B7280';
  const borderColor = '#D1D5DB';

  doc
    .rect(0, 0, doc.page.width, 106)
    .fill('#EEF2FF');

  doc
    .fillColor(primaryColor)
    .fontSize(24)
    .text('MAINTENANCE INVOICE', 44, 40, { align: 'left' });

  doc
    .fillColor('#111827')
    .fontSize(11)
    .text('KAMAXI TRIPLEX Society Management', 44, 78, { align: 'left' });

  doc
    .fontSize(10)
    .fillColor('#374151')
    .text(`Invoice No: ${invoiceNo}`, 350, 44, { width: 200, align: 'right' })
    .text(`Invoice Date: ${invoiceDate.toLocaleDateString()}`, 350, 60, { width: 200, align: 'right' })
    .text(`Due Date: ${dueDate.toLocaleDateString()}`, 350, 76, { width: 200, align: 'right' });

  doc.moveDown(2.6);

  const sectionTop = 136;
  doc
    .lineWidth(1)
    .strokeColor(borderColor)
    .roundedRect(44, sectionTop, 250, 94, 6)
    .stroke();
  doc
    .roundedRect(306, sectionTop, 250, 94, 6)
    .stroke();

  doc
    .fontSize(11)
    .fillColor(primaryColor)
    .text('Billed By', 58, sectionTop + 14)
    .fillColor('#111827')
    .fontSize(10)
    .text('KAMAXI TRIPLEX', 58, sectionTop + 34)
    .fillColor(mutedColor)
    .text('Opp. Motnath Mahadev, Harni Road', 58, sectionTop + 50)
    .text('Vadodara, Gujarat - 390022', 58, sectionTop + 64);

  doc
    .fontSize(11)
    .fillColor(primaryColor)
    .text('Billed To', 320, sectionTop + 14)
    .fillColor('#111827')
    .fontSize(10)
    .text(user.name || 'Resident', 320, sectionTop + 34)
    .fillColor(mutedColor)
    .text(`Apartment: ${user.apartmentNumber || 'N/A'}`, 320, sectionTop + 50)
    .text(`Email: ${user.email || 'N/A'}`, 320, sectionTop + 64)
    .text(`Phone: ${user.phone || 'N/A'}`, 320, sectionTop + 78);

  const tableTop = 258;
  const col1X = 60;
  const col2X = 370;
  const col3X = 470;

  doc
    .lineWidth(1)
    .fillColor('#F3F4F6')
    .rect(44, tableTop, 512, 28)
    .fill();

  doc
    .fillColor('#111827')
    .fontSize(10)
    .text('Description', col1X, tableTop + 9)
    .text('Due Date', col2X, tableTop + 9)
    .text('Amount', col3X, tableTop + 9, { width: 70, align: 'right' });

  const rowTop = tableTop + 28;
  doc
    .lineWidth(1)
    .strokeColor(borderColor)
    .rect(44, rowTop, 512, 34)
    .stroke();

  doc
    .fillColor('#111827')
    .fontSize(10)
    .text('Society Maintenance', col1X, rowTop + 11)
    .text(dueDate.toLocaleDateString(), col2X, rowTop + 11)
    .text(`INR ${safeAmount.toFixed(2)}`, col3X, rowTop + 11, { width: 70, align: 'right' });

  const totalTop = rowTop + 50;
  doc
    .lineWidth(1)
    .strokeColor(borderColor)
    .rect(334, totalTop, 222, 38)
    .stroke();

  doc
    .fillColor(primaryColor)
    .fontSize(12)
    .text('Total Due', 350, totalTop + 12)
    .fontSize(14)
    .text(`INR ${safeAmount.toFixed(2)}`, 440, totalTop + 10, { width: 100, align: 'right' });

  const footerTop = totalTop + 74;
  doc
    .fontSize(10)
    .fillColor(mutedColor)
    .text(
      'Please complete payment on or before the due date and retain this invoice for your records.',
      44,
      footerTop,
      { width: 512, align: 'left' }
    )
    .moveDown(0.7)
    .text('For support, contact: society@kamaxitriplex.me | +91 90991 95719');

  doc.end();
}

module.exports = generateInvoicePdf;