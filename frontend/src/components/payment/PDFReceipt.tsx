"use client";

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
  paymentId: string;
  orderId: string;
  amount: number;
  description: string;
  date: string;
  time: string;
  customerName?: string;
  customerEmail?: string;
}

export const generatePDFReceipt = async (receiptData: ReceiptData) => {
  // Create a temporary div to render the receipt
  const receiptDiv = document.createElement('div');
  receiptDiv.innerHTML = `
    <div style="
      width: 800px;
      min-height: 900px;
      background: white;
      padding: 0;
      font-family: 'Courier New', monospace;
      color: #333;
      position: relative;
      border: 3px solid #333;
      font-size: 14px;
      line-height: 1.4;
    ">
      
      <!-- Header with borders -->
      <div style="
        border-bottom: 3px solid #333;
        padding: 20px;
        text-align: center;
        background: white;
      ">
        <h1 style="
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 10px 0;
          color: #667eea;
          letter-spacing: 2px;
        ">CONNECTING FUTURE</h1>
        <p style="
          font-size: 18px;
          margin: 0;
          color: #764ba2;
          font-weight: bold;
        ">Payment Receipt</p>
      </div>

      <!-- Receipt Date and Time -->
      <div style="
        padding: 20px 40px;
        border-bottom: 1px solid #ddd;
      ">
        <p style="margin: 10px 0; font-size: 16px; color: #333;">
          <strong>Receipt Date:</strong> ${receiptData.date}
        </p>
        <p style="margin: 10px 0; font-size: 16px; color: #333;">
          <strong>Receipt Time:</strong> ${receiptData.time}
        </p>
      </div>

      <!-- Payment Details Section -->
      <div style="
        padding: 30px 40px;
      ">
        <!-- Payment Details Header -->
        <div style="
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          margin-bottom: 25px;
          background: #f8f9ff;
        ">
          <h2 style="
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 1px;
          ">PAYMENT DETAILS</h2>
        </div>

        <!-- Payment Information -->
        <div style="padding: 0 20px;">
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Payment ID:</strong> <span style="color: #667eea; font-weight: 600;">${receiptData.paymentId}</span>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Order ID:</strong> <span style="color: #667eea; font-weight: 600;">${receiptData.orderId}</span>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Amount:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">₹${receiptData.amount.toLocaleString()}</span>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Description:</strong> ${receiptData.description}
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ Payment Successful</span>
          </p>
        </div>
      </div>

      <!-- Thank You Section -->
      <div style="
        padding: 30px 40px;
        border-top: 1px solid #ddd;
      ">
        <!-- Thank You Header -->
        <div style="
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          margin-bottom: 25px;
          background: #f8f9ff;
        ">
          <h2 style="
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 1px;
          ">THANK YOU</h2>
        </div>

        <!-- Impact Message -->
        <div style="padding: 0 20px;">
          <p style="margin: 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
            Your generous contribution will help us:
          </p>
          <ul style="margin: 15px 0; padding-left: 20px; color: #333; font-size: 16px; line-height: 1.8;">
            <li>Connect alumni with students</li>
            <li>Create opportunities for future generations</li>
            <li>Build a stronger community</li>
            <li>Support educational initiatives</li>
          </ul>
        </div>
      </div>

      <!-- Contact Info Section -->
      <div style="
        padding: 30px 40px;
        border-top: 1px solid #ddd;
      ">
        <!-- Contact Info Header -->
        <div style="
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          margin-bottom: 25px;
          background: #f8f9ff;
        ">
          <h2 style="
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 1px;
          ">CONTACT INFO</h2>
        </div>

        <!-- Contact Details -->
        <div style="padding: 0 20px;">
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Website:</strong> <span style="color: #667eea;">https://alumnex.com</span>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Email:</strong> <span style="color: #667eea;">support@alumnex.com</span>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            <strong>Phone:</strong> +91-XXXXXXXXXX
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        padding: 30px 40px;
        border-top: 2px solid #333;
        text-align: center;
        background: #f9f9f9;
      ">
        <p style="
          margin: 15px 0;
          font-size: 16px;
          color: #333;
          line-height: 1.6;
        ">
          This receipt serves as proof of your donation.<br>
          Please keep it for your records.
        </p>
        <p style="
          margin: 20px 0 0;
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
        ">
          Thank you for supporting our mission!
        </p>
      </div>
    </div>
  `;

  // Append to body temporarily
  document.body.appendChild(receiptDiv);

  try {
    // Convert to canvas
    const canvas = await html2canvas(receiptDiv, {
      width: 800,
      height: receiptDiv.offsetHeight,
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white'
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit on A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `connecting-future-receipt-${timestamp}.pdf`;
    
    // Download PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF receipt');
  } finally {
    // Clean up
    document.body.removeChild(receiptDiv);
  }
}; 