"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { jsPDF } from "jspdf";

interface ShipmentPDFExporterProps {
  shipmentId: string;
  shipmentData: any;
}

export function ShipmentPDFExporter({ shipmentId, shipmentData }: ShipmentPDFExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      console.log('Starting PDF generation for shipment:', shipmentId);
      console.log('Shipment data:', shipmentData);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with word wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Noka Shipment Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Shipment ID: ${shipmentId}`, 20, yPosition);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, yPosition, { align: "right" });
      yPosition += 20;

      // Shipment Details
      const shipment = shipmentData;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`${shipment.order?.listing?.cropType || 'Product'} Shipment`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Quantity: ${shipment.order?.quantity || 0} kg`, 20, yPosition);
      doc.text(`Total Price: ₹${shipment.order?.totalPrice?.toLocaleString() || '0'}`, pageWidth - 20, yPosition, { align: "right" });
      yPosition += 10;

      doc.text(`Status: ${shipment.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}`, 20, yPosition);
      yPosition += 20;

      // Farmer Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("👨‍🌾 Farmer (Origin)", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${shipment.order?.listing?.farmer?.name || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email: ${shipment.order?.listing?.farmer?.email || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Location: ${shipment.order?.listing?.location || 'N/A'}`, 20, yPosition);
      yPosition += 15;

      if (shipment.order?.listing?.farmer?.publicHashId) {
        doc.setFontSize(10);
        doc.text("Farmer Hash:", 20, yPosition);
        yPosition += 6;
        doc.setFontSize(8);
        const farmerHash = shipment.order.listing.farmer.publicHashId;
        yPosition = addWrappedText(farmerHash, 20, yPosition, pageWidth - 40, 8);
        yPosition += 5;
      }

      // Buyer Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🛒 Buyer (Destination)", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${shipment.order?.buyer?.name || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email: ${shipment.order?.buyer?.email || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Delivery Address: ${shipment.order?.deliveryAddress || 'N/A'}`, 20, yPosition);
      yPosition += 15;

      if (shipment.order?.buyer?.publicHashId) {
        doc.setFontSize(10);
        doc.text("Buyer Hash:", 20, yPosition);
        yPosition += 6;
        doc.setFontSize(8);
        const buyerHash = shipment.order.buyer.publicHashId;
        yPosition = addWrappedText(buyerHash, 20, yPosition, pageWidth - 40, 8);
        yPosition += 5;
      }

      // Transporter Section
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🚛 Transporter", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${shipment.transporter?.name || 'N/A'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Email: ${shipment.transporter?.email || 'N/A'}`, 20, yPosition);
      yPosition += 15;

      if (shipment.transporter?.publicHashId) {
        doc.setFontSize(10);
        doc.text("Transporter Hash:", 20, yPosition);
        yPosition += 6;
        doc.setFontSize(8);
        const transporterHash = shipment.transporter.publicHashId;
        yPosition = addWrappedText(transporterHash, 20, yPosition, pageWidth - 40, 8);
        yPosition += 5;
      }

      // Provenance Chain
      if (shipment.order?.provenanceChain?.events?.length > 0) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`🔐 Provenance Chain (${shipment.order.provenanceChain.events.length} events)`, 20, yPosition);
        yPosition += 15;

        shipment.order.provenanceChain.events.forEach((event: any, index: number) => {
          if (yPosition > pageHeight - 80) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Event #${index + 1}: ${event.type || 'Unknown'}`, 20, yPosition);
          yPosition += 8;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Timestamp: ${event.createdAt ? new Date(event.createdAt).toLocaleString() : 'N/A'}`, 20, yPosition);
          yPosition += 8;

          doc.setFontSize(9);
          doc.text("Event Hash:", 20, yPosition);
          yPosition += 6;
          doc.setFontSize(7);
          yPosition = addWrappedText(event.hash || 'N/A', 20, yPosition, pageWidth - 40, 7);
          yPosition += 10;
        });

        // Final Chain Hash
        if (shipment.order.provenanceChain.lastHash) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Final Chain Hash:", 20, yPosition);
          yPosition += 10;
          doc.setFontSize(8);
          yPosition = addWrappedText(shipment.order.provenanceChain.lastHash, 20, yPosition, pageWidth - 40, 8);
        }
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Generated by Noka Agricultural Supply Chain Platform • Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      console.log('PDF generated successfully, saving...');
      doc.save(`shipment-${shipmentId}-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF saved successfully');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex-1"
      variant="outline"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Generating PDF...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          <Download className="h-4 w-4 mr-2" />
          Export PDF Report
        </>
      )}
    </Button>
  );
}
