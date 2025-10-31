"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ShipmentPDFExporterProps {
  shipmentId: string;
}

export function ShipmentPDFExporter({ shipmentId }: ShipmentPDFExporterProps) {
  const handleExportPDF = async () => {
    try {
      // First try the html2pdf approach with sanitization
      await generatePDFWithHtml2pdf(shipmentId);
    } catch (html2pdfError) {
      console.warn('html2pdf failed, trying fallback method:', html2pdfError);
      try {
        // Fallback to simple jsPDF approach
        await generatePDFFallback(shipmentId);
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
        alert('Failed to generate PDF. Please try again.');
      }
    }
  };

  // Modern html2pdf approach with sanitization
  const generatePDFWithHtml2pdf = async (id: string) => {
    const html2pdf = (await import('html2pdf.js')).default;

      // Get the content element to export
      const element = document.querySelector('[data-pdf-content="true"]') as HTMLElement;
      if (!element) {
        alert('Unable to find content to export. Please try again.');
        return;
      }

      // Clone the element and sanitize it for PDF generation
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Function to sanitize styles recursively - AGGRESSIVE approach
      const sanitizeElement = (el: HTMLElement) => {
        // Check if this element or any of its computed styles contain modern color functions
        const computedStyle = getComputedStyle(el);
        let hasModernColors = false;

        // Check all computed properties for modern color functions
        for (let i = 0; i < computedStyle.length; i++) {
          const prop = computedStyle[i];
          const value = computedStyle.getPropertyValue(prop);
          if (value && (value.includes('oklch') || value.includes('hsl(') || value.includes('hwb(') ||
              value.includes('lab(') || value.includes('lch(') || value.includes('color('))) {
            hasModernColors = true;
            break;
          }
        }

        // If element has modern colors anywhere, strip ALL styles and classes
        if (hasModernColors || el.className) {
          // Remove all attributes that could contain styles
          el.removeAttribute('style');
          el.removeAttribute('class');

          // Set minimal safe inline styles
          el.style.cssText = `
            color: #000000 !important;
            background-color: #ffffff !important;
            border: 1px solid #cccccc !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            padding: 4px 8px !important;
            box-sizing: border-box !important;
            text-decoration: none !important;
          `;

          // Special handling for different element types
          if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
            el.style.fontSize = '16px !important';
            el.style.fontWeight = 'bold !important';
            el.style.marginBottom = '8px !important';
          } else if (el.tagName === 'P') {
            el.style.marginBottom = '8px !important';
          } else if (el.tagName === 'DIV') {
            el.style.marginBottom = '4px !important';
          }
        }

        // Recursively process all child elements
        Array.from(el.children).forEach(child => sanitizeElement(child as HTMLElement));
      };

      sanitizeElement(clonedElement);

      // Add the cloned element to body temporarily (hidden)
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '-9999px';
      clonedElement.style.width = '800px'; // Fixed width for PDF
      clonedElement.className = 'pdf-export-element'; // Add class for styling
      document.body.appendChild(clonedElement);

      // Add comprehensive CSS overrides
      const style = document.createElement('style');
      style.textContent = `
        /* Force all colors to be compatible with html2canvas */
        .pdf-export-element,
        .pdf-export-element * {
          color: #000000 !important;
          background-color: #ffffff !important;
          border-color: #000000 !important;
          font-family: 'Arial', sans-serif !important;
        }

        /* Override all CSS custom properties */
        .pdf-export-element {
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --muted: #f3f4f6 !important;
          --muted-foreground: #6b7280 !important;
          --border: #e5e7eb !important;
          --card: #ffffff !important;
          --primary: #000000 !important;
          --secondary: #f3f4f6 !important;
          --accent: #f3f4f6 !important;
        }

        /* Override Tailwind utility classes */
        .pdf-export-element .bg-card,
        .pdf-export-element .bg-background,
        .pdf-export-element .bg-white { background-color: #ffffff !important; }
        .pdf-export-element .text-foreground,
        .pdf-export-element .text-black { color: #000000 !important; }
        .pdf-export-element .text-muted-foreground { color: #6b7280 !important; }
        .pdf-export-element .border { border-color: #e5e7eb !important; }
        .pdf-export-element .border-gray-200 { border-color: #e5e7eb !important; }

        /* Typography */
        .pdf-export-element body,
        .pdf-export-element p,
        .pdf-export-element div,
        .pdf-export-element span,
        .pdf-export-element h1,
        .pdf-export-element h2,
        .pdf-export-element h3,
        .pdf-export-element h4,
        .pdf-export-element h5,
        .pdf-export-element h6 {
          color: #000000 !important;
          font-family: 'Arial', sans-serif !important;
        }

        .pdf-export-element .font-mono {
          font-family: 'Courier New', monospace !important;
        }

        /* Remove any shadows or complex effects */
        .pdf-export-element * {
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
      `;
      document.head.appendChild(style);

      // Configure PDF options with error handling
      const options = {
        margin: 0.5, // margin in inches
        filename: `shipment-${shipmentId}-tracking-report.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 1, // Use 1:1 scale for the cloned element
          useCORS: true,
          allowTaint: false, // Disable taint for better compatibility
          backgroundColor: '#ffffff',
          width: 800, // Match the cloned element width
          height: clonedElement.scrollHeight, // Use actual height
          windowWidth: 800,
          windowHeight: clonedElement.scrollHeight,
          logging: false, // Disable logging for cleaner output
          ignoreElements: (element: Element) => {
            // Skip elements that might cause issues
            return element.classList.contains('sr-only') ||
                   element.getAttribute('aria-hidden') === 'true';
          },
          onclone: (clonedDoc: Document) => {
            // Additional sanitization in the cloned document
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                color: #000000 !important;
                background-color: #ffffff !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        },
        jsPDF: {
          unit: 'in' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
          compress: true,
          putOnlyUsedFonts: true
        }
      };

      try {
        // Generate and download PDF using the sanitized cloned element
        await html2pdf().set(options).from(clonedElement).save();
        console.log('PDF generated successfully');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);

        // Fallback: try with even simpler settings
        try {
          const fallbackOptions = {
            ...options,
            html2canvas: {
              ...options.html2canvas,
              scale: 1,
              allowTaint: false,
              ignoreElements: () => false, // Don't ignore elements, but use simpler rendering
            }
          };

          await html2pdf().set(fallbackOptions).from(clonedElement).save();
          console.log('PDF generated with fallback settings');
        } catch (fallbackError) {
          console.error('Fallback PDF generation also failed:', fallbackError);
          throw new Error('PDF generation failed even with fallback settings');
        }
      }

      // Clean up: remove the cloned element and style
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
  };

  // Fallback PDF generation using jsPDF with actual shipment data
  const generatePDFFallback = async (id: string) => {
    const { jsPDF } = await import('jspdf');

    // Extract shipment data from the page
    const extractShipmentData = () => {
      const data: any = {
        shipmentId: id,
        farmer: { name: '', email: '', phone: '', location: '', hash: '' },
        buyer: { name: '', email: '', phone: '', address: '', hash: '' },
        transporter: { name: '', email: '', phone: '', hash: '' },
        product: { name: '', hash: '' },
        status: '',
        pickupLocation: '',
        deliveryLocation: '',
        createdAt: '',
        provenanceEvents: []
      };

      try {
        // More robust extraction using data attributes and simpler selectors
        const pdfContent = document.querySelector('[data-pdf-content="true"]');
        if (!pdfContent) {
          console.warn('PDF content element not found');
          return data;
        }

        // Extract farmer info
        const farmerCard = pdfContent.querySelector('h3');
        if (farmerCard && farmerCard.textContent?.includes('Farmer')) {
          const farmerCardElement = farmerCard.closest('[class*="border"]');
          if (farmerCardElement) {
            const spans = farmerCardElement.querySelectorAll('span');
            const paragraphs = farmerCardElement.querySelectorAll('p');

            // Find spans containing user data
            spans.forEach(span => {
              const text = span.textContent?.trim() || '';
              if (text && text.includes('@') && text.includes('.')) {
                data.farmer.email = text;
              } else if (text && text.length > 2 && !text.includes('@')) {
                data.farmer.name = text;
              }
            });

            // Find hashes in paragraphs
            paragraphs.forEach(p => {
              const text = p.textContent?.trim() || '';
              if (text && text.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(text.replace(/\s/g, ''))) {
                if (!data.farmer.hash) {
                  data.farmer.hash = text;
                } else if (!data.product.hash) {
                  data.product.hash = text;
                }
              }
            });
          }
        }

        // Extract buyer info
        const buyerCard = Array.from(pdfContent.querySelectorAll('h3')).find(h => h.textContent?.includes('Buyer'));
        if (buyerCard) {
          const buyerCardElement = buyerCard.closest('[class*="border"]');
          if (buyerCardElement) {
            const spans = buyerCardElement.querySelectorAll('span');
            const paragraphs = buyerCardElement.querySelectorAll('p');

            spans.forEach(span => {
              const text = span.textContent?.trim() || '';
              if (text && text.includes('@') && text.includes('.')) {
                data.buyer.email = text;
              } else if (text && text.length > 2 && !text.includes('@')) {
                data.buyer.name = text;
              }
            });

            paragraphs.forEach(p => {
              const text = p.textContent?.trim() || '';
              if (text && text.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(text.replace(/\s/g, ''))) {
                data.buyer.hash = text;
              }
            });
          }
        }

        // Extract transporter info
        const transporterCard = Array.from(pdfContent.querySelectorAll('h3')).find(h => h.textContent?.includes('Transporter'));
        if (transporterCard) {
          const transporterCardElement = transporterCard.closest('[class*="border"]');
          if (transporterCardElement) {
            const spans = transporterCardElement.querySelectorAll('span');
            const paragraphs = transporterCardElement.querySelectorAll('p');

            spans.forEach(span => {
              const text = span.textContent?.trim() || '';
              if (text && text.includes('@') && text.includes('.')) {
                data.transporter.email = text;
              } else if (text && text.length > 2 && !text.includes('@')) {
                data.transporter.name = text;
              }
            });

            paragraphs.forEach(p => {
              const text = p.textContent?.trim() || '';
              if (text && text.length > 20 && /^[a-zA-Z0-9+/=]+$/.test(text.replace(/\s/g, ''))) {
                data.transporter.hash = text;
              }
            });
          }
        }

        // Extract status - look for status in any element
        const allElements = pdfContent.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent?.trim() || '';
          const lowerText = text.toLowerCase();
          if (['pending', 'picked up', 'in transit', 'delivered'].includes(lowerText)) {
            data.status = text;
            break;
          }
        }

        // Extract provenance events - look for chain section
        const provenanceTitle = Array.from(pdfContent.querySelectorAll('h3')).find(h =>
          h.textContent?.toLowerCase().includes('provenance') ||
          h.textContent?.toLowerCase().includes('chain')
        );

        if (provenanceTitle) {
          const provenanceContainer = provenanceTitle.closest('[class*="border"]');
          if (provenanceContainer) {
            // Find all event cards within the provenance section
            const eventCards = provenanceContainer.querySelectorAll('[class*="border"][class*="rounded"]');
            eventCards.forEach((eventCard, index) => {
              const h4 = eventCard.querySelector('h4');
              const timestamp = eventCard.querySelector('[class*="text-muted-foreground"]');
              const hash = eventCard.querySelector('p[class*="font-mono"]');

              const type = h4?.textContent?.trim() || '';
              const timestampText = timestamp?.textContent?.trim() || '';
              const hashText = hash?.textContent?.trim() || '';

              // Extract actor from payload data
              let actor = '';
              const payloadItems = eventCard.querySelectorAll('[class*="justify-between"]');
              payloadItems.forEach(item => {
                const label = item.querySelector('span')?.textContent?.toLowerCase() || '';
                const value = item.querySelectorAll('span')[1]?.textContent?.trim() || '';
                if (label.includes('actor') || label.includes('transporter') || label.includes('buyer') || label.includes('farmer')) {
                  actor = value;
                }
              });

              if (type || hashText) {
                data.provenanceEvents.push({
                  index: index + 1,
                  type,
                  actor,
                  timestamp: timestampText,
                  hash: hashText
                });
              }
            });
          }
        }
      } catch (error) {
        console.warn('Error extracting shipment data:', error);
      }

      // Debug logging
      console.log('Extracted shipment data:', {
        farmer: data.farmer,
        buyer: data.buyer,
        transporter: data.transporter,
        product: data.product,
        status: data.status,
        eventsCount: data.provenanceEvents.length
      });

      return data;
    };

    const shipmentData = extractShipmentData();

    // Create a new PDF document
    const pdf = new jsPDF();
    let yPosition = 20;

    // Set basic styling
    pdf.setFont('helvetica', 'normal');

    // Add title
    pdf.setFontSize(18);
    pdf.text('Shipment Tracking Report', 20, yPosition);
    yPosition += 15;

    // Add shipment ID
    pdf.setFontSize(12);
    pdf.text(`Shipment ID: ${shipmentData.shipmentId}`, 20, yPosition);
    yPosition += 10;

    // Add timestamp
    const now = new Date();
    pdf.text(`Generated on: ${now.toLocaleString()}`, 20, yPosition);
    yPosition += 10;

    // Add status
    if (shipmentData.status) {
      pdf.text(`Status: ${shipmentData.status}`, 20, yPosition);
      yPosition += 15;
    }

    // Farmer Information
    if (shipmentData.farmer.name) {
      pdf.setFontSize(14);
      pdf.text('From (Farmer):', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Name: ${shipmentData.farmer.name}`, 30, yPosition);
      yPosition += 8;

      if (shipmentData.farmer.email) {
        pdf.text(`Email: ${shipmentData.farmer.email}`, 30, yPosition);
        yPosition += 8;
      }

      if (shipmentData.farmer.hash) {
        pdf.text('Hash:', 30, yPosition);
        yPosition += 6;
        pdf.setFont('courier', 'normal');
        const hashLines = pdf.splitTextToSize(shipmentData.farmer.hash, 140);
        pdf.text(hashLines, 40, yPosition);
        yPosition += hashLines.length * 5 + 5;
        pdf.setFont('helvetica', 'normal');
      }

      yPosition += 5;
    }

    // Buyer Information
    if (shipmentData.buyer.name) {
      pdf.setFontSize(14);
      pdf.text('To (Buyer):', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Name: ${shipmentData.buyer.name}`, 30, yPosition);
      yPosition += 8;

      if (shipmentData.buyer.email) {
        pdf.text(`Email: ${shipmentData.buyer.email}`, 30, yPosition);
        yPosition += 8;
      }

      if (shipmentData.buyer.hash) {
        pdf.text('Hash:', 30, yPosition);
        yPosition += 6;
        pdf.setFont('courier', 'normal');
        const hashLines = pdf.splitTextToSize(shipmentData.buyer.hash, 140);
        pdf.text(hashLines, 40, yPosition);
        yPosition += hashLines.length * 5 + 5;
        pdf.setFont('helvetica', 'normal');
      }

      yPosition += 5;
    }

    // Transporter Information
    if (shipmentData.transporter.name) {
      pdf.setFontSize(14);
      pdf.text('Transporter:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Name: ${shipmentData.transporter.name}`, 30, yPosition);
      yPosition += 8;

      if (shipmentData.transporter.email) {
        pdf.text(`Email: ${shipmentData.transporter.email}`, 30, yPosition);
        yPosition += 8;
      }

      if (shipmentData.transporter.hash) {
        pdf.text('Hash:', 30, yPosition);
        yPosition += 6;
        pdf.setFont('courier', 'normal');
        const hashLines = pdf.splitTextToSize(shipmentData.transporter.hash, 140);
        pdf.text(hashLines, 40, yPosition);
        yPosition += hashLines.length * 5 + 5;
        pdf.setFont('helvetica', 'normal');
      }

      yPosition += 5;
    }

    // Product Information
    if (shipmentData.product.hash) {
      pdf.setFontSize(14);
      pdf.text('Product:', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text('Hash:', 30, yPosition);
      yPosition += 6;
      pdf.setFont('courier', 'normal');
      const hashLines = pdf.splitTextToSize(shipmentData.product.hash, 140);
      pdf.text(hashLines, 40, yPosition);
      yPosition += hashLines.length * 5 + 10;
      pdf.setFont('helvetica', 'normal');
    }

    // Provenance Chain
    if (shipmentData.provenanceEvents.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Provenance Chain:', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      shipmentData.provenanceEvents.forEach((event: any, index: number) => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.text(`${index + 1}. ${event.type}`, 30, yPosition);
        yPosition += 8;

        if (event.actor) {
          pdf.text(`Actor: ${event.actor}`, 40, yPosition);
          yPosition += 6;
        }

        if (event.timestamp) {
          pdf.text(`Time: ${event.timestamp}`, 40, yPosition);
          yPosition += 6;
        }

        if (event.hash) {
          pdf.text('Hash:', 40, yPosition);
          yPosition += 6;
          pdf.setFont('courier', 'normal');
          const hashLines = pdf.splitTextToSize(event.hash, 120);
          pdf.text(hashLines, 50, yPosition);
          yPosition += hashLines.length * 5 + 8;
          pdf.setFont('helvetica', 'normal');
        }
      });
    }

    // Add note about CSS issues
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(8);
    pdf.text('Note: This PDF was generated using fallback method due to CSS compatibility issues.', 20, yPosition);
    yPosition += 6;
    pdf.text('For the complete visual experience, please view the shipment page in your web browser.', 20, yPosition);

    // Save the PDF
    pdf.save(`shipment-${id}-tracking-report.pdf`);
    console.log('Detailed PDF generated successfully with shipment data');
  };

  return (
    <Button onClick={handleExportPDF} className="w-full" variant="secondary">
      <Download className="h-4 w-4 mr-2" />
      Download PDF Report
    </Button>
  );
}
