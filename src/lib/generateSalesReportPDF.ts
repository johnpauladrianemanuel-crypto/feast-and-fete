import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportOrder {
  id: string | number;
  created_at: string;
  customer_name: string;
  items_summary: string;
  total_amount: number;
  status: string;
}

interface ReportOptions {
  dateRangeLabel?: string;
  generatedBy?: string;
}

export function generateSalesReportPDF(
  orders: ReportOrder[],
  options: ReportOptions = {}
) {
  const doc = new jsPDF();
  const dateRangeLabel = options.dateRangeLabel || 'Sales Report';
  const generatedBy = options.generatedBy || 'Admin Representative';

  // --- Header Styling ---
  doc.setFillColor(26, 15, 10); // Brand Dark Color
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(212, 160, 23); // Gold Color
  doc.text('Feast & Fête', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(230, 213, 184);
  doc.text(`Official Sales Report — ${dateRangeLabel}`, 14, 26);

  // Metadata Box
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Range: ${dateRangeLabel}`, 14, 46);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`,
    14,
    52
  );
  doc.text(`Prepared By: ${generatedBy}`, 14, 58);

  // --- Summary Card ---
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  doc.setFillColor(245, 240, 235);
  doc.roundedRect(120, 42, 76, 22, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(120, 100, 90);
  doc.text('TOTAL PERIOD REVENUE', 125, 49);

  doc.setFontSize(13);
  doc.setTextColor(26, 15, 10);
  doc.text(
    `PHP ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    125,
    58
  );

  // Prepare autoTable Rows
  const tableRows = orders.map((o) => [
    o.created_at
      ? new Date(o.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'N/A',
    `#${o.id}`,
    o.customer_name || 'Guest',
    o.items_summary || 'Food Items',
    o.status || 'Completed',
    `PHP ${Number(o.total_amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })}`,
  ]);

  // Render Table
  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Order ID', 'Customer', 'Items Summary', 'Status', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 15, 10],
      textColor: [212, 160, 23],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [250, 248, 245],
    },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Save File
  const safeLabel = dateRangeLabel.replace(/\s+/g, '_');
  doc.save(`Sales_Report_${safeLabel}.pdf`);
}