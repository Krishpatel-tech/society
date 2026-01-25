const PDFDocument = require('pdfkit');

function generateInvoicePdf(payment, user, callback) {
  const doc = new PDFDocument({ margin: 50 });

  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    let pdfData = Buffer.concat(buffers);
    callback(pdfData);
  });

  // Add Header
  doc.fontSize(25).text('Maintenance Invoice', { align: 'center' });
  doc.fontSize(10).text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  // Add Society Details
  doc.fontSize(12).text('KAMAXI TRIPLEX');
  doc.text('Opp. Motnath Mahadev, Harni road');
  doc.text('Vadodara, Gujarat, 390022'); // Replace with actual society address
  doc.moveDown();

  // Add Member Details
  doc.fontSize(12).text(`Bill To: ${user.name}`);
  doc.text(`Apartment: ${user.apartmentNumber}`);
  doc.text(`Email: ${user.email}`);
  doc.text(`Phone: ${user.phone || 'N/A'}`);
  doc.moveDown();

  // Add Payment Details Table
  doc.fontSize(15).text('Payment Details:');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const itemX = 50;
  const descriptionX = 150;
  const amountX = 400;

  doc.fontSize(12)
    .text('Description', descriptionX, tableTop, { bold: true })
    .text('Amount', amountX, tableTop, { bold: true });

  doc.moveTo(itemX, tableTop + 20)
    .lineTo(550, tableTop + 20)
    .stroke();

  const paymentY = tableTop + 30;
  doc.fontSize(10)
    .text(`Maintenance Fee for ${new Date(payment.dueDate).toLocaleDateString()}`, descriptionX, paymentY)
    .text(`₹${payment.amount.toFixed(2)}`, amountX, paymentY);

  doc.moveDown();
  doc.moveDown();

  // Total
  doc.fontSize(12).text(`Total Due: ₹${payment.amount.toFixed(2)}`, 400, doc.y, { bold: true });
  doc.moveDown();

  // Footer
  doc.fontSize(10).text('Thank you for your timely payment.', { align: 'center' });

  doc.end();
}

module.exports = generateInvoicePdf;