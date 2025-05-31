import puppeteer from 'puppeteer';
import fs from 'fs';

export const generateInvoice = async (req, res) => {
    const { payload } = req.body;
    console.log("Received invoice data:", payload);


    const imgPath = 'C:/Coding/Invoice/trex_server/public/logo.jpeg';
    const base64Image = fs.readFileSync(imgPath, { encoding: 'base64' });
    const dataURI = `data:image/jpeg;base64,${base64Image}`;

    try {
        // Calculate total (no tax)
        const total = payload.services.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
        const remainingAmount = total - (parseFloat(payload.paidAmount) || 0);

        // Generate invoice number and date
        const invoiceNo = String(Date.now()).slice(-5);
        const invoiceDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // HTML template optimized for perfect A4 size
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=210mm, initial-scale=1.0">
            <title>Invoice</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    width: 100%;
                    height: 100%;
                   
                }
                .invoice-container {
                    width: 100%;
                    min-height: 100%;
                    background: white;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    
                }
                .header {
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    color: white;
                    padding: 3mm 5mm;
                    position: relative;
                    im
                }
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 50mm;
                    height: 50mm;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    transform: translate(25mm, -25mm);
                }
               .company-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1mm;
                }
                .logo-and-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .company-name {
                    font-size: 24px; /* Thoda chhota kiya for better fit */
                    font-weight: bold;
                    margin: 3mm 0mm;
                }
                .company-tagline {
                    font-size: 12px; /* Thoda compact look */
                    letter-spacing: 1px;
                    color: #fff; /* White color for contrast in header */
                }
                .company-details {
                    text-align: right;
                    font-size: 20px; /* Consistency ke liye thoda adjust kiya */
                    line-height: 1.6;
                    margin-top: 5px ;
                }
                .company-sub-details {
                    margin:10px 0px;
                    font-size: 16px; /* Thoda chhota kiya for better fit */
                }
                .invoice-titles {
                    font-size: 40px;
                    font-weight: bold;
                    text-align: right;
                }
                .content {
                    padding: 10mm;
                    flex-grow: 1;
                }
                .invoice-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10mm;
                    font-size: 14px;
                }
                .invoice-details, .client-info {
                    flex: 1;
                }
                .client-info {
                    text-align: right;
                }
                .label {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 2mm;
                }
                .value {
                    color: #666;
                    margin-bottom: 5mm;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 8mm;
                    font-size: 14px;
                }
                .invoice-table th {
                    background-color: #f8f9fa;
                    padding: 3mm;
                    font-weight: bold;
                    color: #333;
                    border-bottom: 2px solid #e9ecef;
                }
                .text-right {
                    text-align: right;
                    }
                
                
                .totals {
                    max-width: 80mm;
                    margin-left: auto;
                    margin-bottom: 10mm;
                    font-size: 14px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 3mm 0;
                    border-bottom: 1px solid #e9ecef;
                }
                .total-row.final {
                    font-weight: bold;
                    font-size: 16px;
                    color: #2563eb;
                    border-bottom: 2px solid #2563eb;
                    margin-top: 3mm;
                    padding-top: 5mm;
                }
                .payment-info {
                    background-color: #f8f9fa;
                    padding: 8mm;
                    border-radius: 6px;
                    margin-bottom: 10mm;
                    font-size: 14px;
                }
                .payment-title {
                    font-weight: bold;
                    margin-bottom: 5mm;
                    color: #333;
                }
                .footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    font-size: 14px;
                    margin-top: auto;
                    
                }
                .footer-container{
                position: fixed;
                bottom: 4px;
                width: 90%;
                }
                .signature {
                    text-align: center;
                }
                .signature-name {
                    font-weight: bold;
                    margin-bottom: 2mm;
                }
                .signature-title {
                    color: #666;
                    font-size: 12px;
                }
                .terms {
                    max-width: 100mm;
                }
                .terms-title {
                    font-weight: bold;
                    margin-bottom: 3mm;
                }
                .terms-content {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.4;
                }
                .thank-you {
                    text-align: center;
                    color: #2563eb;
                    font-weight: bold;
                    font-size: 16px;
                    margin-top: 8mm;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="company-info">
                        <div>                               
                            <img src="${dataURI}" style="width: 40mm; height: 40mm; border-radius: 50%; object-fit: cover; margin-right: 10mm;" 
                               alt="Company Logo"
                            />                   
                            <div class="company-name">T-REX INFOTECH</div>
                        </div>
                        <div class="company-details">
                            <div class="invoice-titles">INVOICE</div>
                            
                            <div class="company-sub-details">
                                <div>+91 8626072002</div>
                                <div>www.t-rexinfotech.in</div>
                                <div>102 Laxmi Nagar Bldg <br/> Alkapuri Nalasopara East</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="content">
                    <div class="invoice-info">
                        <div class="invoice-details">
                            <div class="label">Invoice No:
                            ${invoiceNo}

                            </div>
                           <div class="label">Date:
                            ${invoiceDate}
                            </div>
                            
                        </div>
                        <div class="client-info">
                            <div class="label" >Invoice To: 
                                ${payload.clientName.toUpperCase()}
                            </div>
                            <div class="label">Contact:
                                ${payload.clientContact}
                            </div>
                            <div class="label">Email:
                                ${payload.clientEmail}
                            </div>
                            
                        </div>
                    </div>
                    
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Service</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>

                            </tr>
                        </thead>
                        <tbody>
                            ${payload.services.map(service => `
                                <tr>
                                    <td>
                                        <strong style="padding-left:13px;" >${service.serviceName}</strong>
                                        ${service.descriptions && service.descriptions.length > 0 && service.descriptions[0] !== '' ?
                                        '<br><small style="color: #666; padding-left:13px; ">' + service.descriptions.filter(desc => desc.trim() !== '').join(', ') + '</small>'
                                        : ''
                                }
                                    </td>
                                    <td class="text-right">$${parseFloat(service.price).toFixed(2)}</td>
                                    <td class="text-right">$${parseFloat(service.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <div class="total-row final">
                            <span>Total:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                        ${payload.paidAmount > 0 ? `
                            <div class="total-row">
                                <span>Paid Amount:</span>
                                <span style="color: #22c55e;">-$${parseFloat(payload.paidAmount).toFixed(2)}</span>
                            </div>
                            <div class="total-row final" style="color: #2563eb;">
                                <span>Remaining Due:</span>
                                <span>$${remainingAmount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="payment-info">
                        <div class="payment-title">Payment Method:
                            
                                ${payload.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                payload.paymentMethod === 'credit_card' ? 'Credit Card' :
                    payload.paymentMethod === 'cash' ? 'Cash' :
                        payload.paymentMethod === 'paypal' ? 'PayPal' : 'Other'}
                            
                                    ${payload.paymentMethod === 'bank_transfer' ? `                             
                            ` : ''}
                            
                        </div>
                    </div>
                    
                    <div class="footer-container">
                        <div class="footer">
                            <div class="terms">
                                <div class="terms-title">Terms and Conditions</div>
                                <div class="terms-content">
                                    Please send payment within 30 days of receiving this invoice. 
                                    There will be 10% interest charge per month on late invoice.
                                </div>
                            </div>
                            <div class="signature">
                                <div class="signature-name">Francisco Andrade</div>
                                <div class="signature-title">Administrator</div>
                            </div>
                        </div>                       
                        <div class="thank-you">Thank you for your business!</div>
                    </div>
                    
                </div>
            </div>
        </body>
        </html>
        `;

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        // Set viewport to match A4 at 96 DPI
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate single-page PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            preferCSSPageSize: true,
            pageRanges: '1' // Ensure only one page
        });

        await browser.close();

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNo}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF buffer as response
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        res.status(500).json({
            error: 'Failed to generate invoice PDF',
            details: error.message
        });
    }
};