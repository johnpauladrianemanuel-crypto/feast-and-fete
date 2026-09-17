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

async function loadLogo(): Promise<string | null> {
  try {
    const response = await fetch('/assets/images/Logo123.png');
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function generateSalesReportPDF(
  orders: ReportOrder[],
  options: ReportOptions = {}
): Promise<void> {
  return (async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const logo = await loadLogo();
  const dateRangeLabel = options.dateRangeLabel || 'Sales Report';
  const generatedBy = options.generatedBy || 'Admin Representative';
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    if (logo) {
      doc.addImage(logo, 'PNG', pageWidth - margin - 23, 10, 23, 23);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(82, 82, 82);
    doc.text('PRINTABLE SALES REPORT', margin, 19);
    doc.text(dateRangeLabel.toUpperCase(), margin, 28);

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, 33, pageWidth - margin, 33);

    const generatedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    autoTable(doc, {
      startY: 38,
      margin: { left: margin, right: margin },
      head: [['REPORT RANGE', 'ASSOCIATE NAME', 'SIGNATURE', 'REPORT COMPLETION DATE']],
      body: [[dateRangeLabel, generatedBy, '', generatedDate]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, textColor: [30, 30, 30], cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.25 },
      headStyles: { fillColor: [203, 212, 222], textColor: [20, 20, 20], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 39 }, 1: { cellWidth: 39 }, 2: { cellWidth: 39 }, 3: { cellWidth: 45 } },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const weeklyRows = orders.map((order) => {
      const dayCells = dayHeaders.map(() => '');
      const date = order.created_at ? new Date(order.created_at) : null;
      const dayIndex = date ? (date.getDay() + 6) % 7 : -1;
      const amount = `PHP ${Number(order.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (dayIndex >= 0) dayCells[dayIndex] = amount;
      const customerAndItems = `${order.customer_name || 'Guest'} - ${order.items_summary || 'Food Items'}`;
      return [customerAndItems, ...dayCells, amount];
    });

    const filledRows = weeklyRows.length > 0 ? weeklyRows : [['', '', '', '', '', '', '', '', '']];
    while (filledRows.length < 19) filledRows.push(['', '', '', '', '', '', '', '', '']);

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10,
      margin: { left: margin, right: margin },
      head: [['CUSTOMER / ORDER ITEMS', ...dayHeaders, 'TOTAL']],
      body: filledRows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 7, textColor: [25, 25, 25], cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.25, minCellHeight: 6.5 },
      headStyles: { fillColor: [203, 212, 222], textColor: [20, 20, 20], fontStyle: 'bold', halign: 'center', minCellHeight: 9 },
      columnStyles: { 0: { cellWidth: 47 }, 1: { cellWidth: 15 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 15 }, 8: { cellWidth: 28 } },
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`TOTAL PERIOD SALES: PHP ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, margin, 272);

    const safeLabel = dateRangeLabel.replace(/\s+/g, '_');
    doc.save(`Sales_Report_${safeLabel}.pdf`);
  })();
}