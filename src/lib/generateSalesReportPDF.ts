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

export interface ReportInventoryItem {
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  status: string;
  lastUpdated?: string;
}

export interface ReportExpense {
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface ReportOptions {
  dateRangeLabel?: string;
  generatedBy?: string;
  inventory?: ReportInventoryItem[];
  expenses?: ReportExpense[];
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

const fmtDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
    doc.setTextColor(43, 26, 18);
    doc.text('PRINTABLE SALES REPORT', margin, 19);
    doc.text(dateRangeLabel.toUpperCase(), margin, 28);

    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(0.8);
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
      alternateRowStyles: { fillColor: [250, 244, 232] },
      styles: { font: 'helvetica', fontSize: 8, textColor: [43, 26, 18], cellPadding: 2.5, lineColor: [200, 169, 154], lineWidth: 0.25 },
      headStyles: { fillColor: [43, 26, 18], textColor: [212, 160, 23], fontStyle: 'bold', halign: 'center' },
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
      return [fmtDate(order.created_at), customerAndItems, ...dayCells, amount];
    });

    const filledRows = weeklyRows.length > 0 ? weeklyRows : [['', '', '', '', '', '', '', '', '', '']];
    while (filledRows.length < 19) filledRows.push(['', '', '', '', '', '', '', '', '', '']);

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10,
      margin: { left: margin, right: margin },
      head: [['DATE', 'CUSTOMER / ORDER ITEMS', ...dayHeaders, 'TOTAL']],
      body: filledRows,
      theme: 'grid',
      alternateRowStyles: { fillColor: [250, 244, 232] },
      styles: { font: 'helvetica', fontSize: 7, textColor: [43, 26, 18], cellPadding: 1.8, lineColor: [200, 169, 154], lineWidth: 0.25, minCellHeight: 6.5 },
      headStyles: { fillColor: [43, 26, 18], textColor: [212, 160, 23], fontStyle: 'bold', halign: 'center', minCellHeight: 9 },
      columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 36 }, 2: { cellWidth: 14 }, 3: { cellWidth: 14 }, 4: { cellWidth: 14 }, 5: { cellWidth: 14 }, 6: { cellWidth: 14 }, 7: { cellWidth: 14 }, 8: { cellWidth: 14 }, 9: { cellWidth: 24 } },
    });

    type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };
    const pageHeight = doc.internal.pageSize.getHeight();
    const money = (n: number) => `PHP ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const sectionStart = (needed: number) => {
      let y = ((doc as DocWithTable).lastAutoTable?.finalY ?? 20) + 8;
      if (y + needed > pageHeight - 15) {
        doc.addPage();
        y = 20;
      }
      return y;
    };
    const sectionTitle = (text: string, y: number) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(43, 26, 18);
      doc.text(text, margin, y);
    };

    let y = sectionStart(10);
    sectionTitle(`TOTAL PERIOD SALES: ${money(totalRevenue)}`, y);
    (doc as DocWithTable).lastAutoTable = { finalY: y };

    const tableStyles = {
      theme: 'grid' as const,
      alternateRowStyles: { fillColor: [250, 244, 232] as [number, number, number] },
      styles: { font: 'helvetica', fontSize: 8, textColor: [43, 26, 18] as [number, number, number], cellPadding: 2, lineColor: [200, 169, 154] as [number, number, number], lineWidth: 0.25 },
      headStyles: { fillColor: [203, 212, 222] as [number, number, number], textColor: [20, 20, 20] as [number, number, number], fontStyle: 'bold' as const, halign: 'center' as const },
      margin: { left: margin, right: margin },
    };

    if (options.inventory) {
      y = sectionStart(30);
      sectionTitle('INVENTORY', y);
      autoTable(doc, {
        ...tableStyles,
        startY: y + 3,
        head: [['LAST UPDATED', 'ITEM', 'UNIT', 'CURRENT STOCK', 'REORDER LEVEL', 'STATUS']],
        body: options.inventory.length
          ? options.inventory.map((i) => [fmtDate(i.lastUpdated), i.name, i.unit, String(i.currentStock), String(i.reorderLevel), i.status])
          : [['', 'No inventory records', '', '', '', '']],
      });
    }

    if (options.expenses) {
      y = sectionStart(30);
      sectionTitle('EXPENSES', y);
      const totalExpenses = options.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      autoTable(doc, {
        ...tableStyles,
        startY: y + 3,
        head: [['DATE', 'CATEGORY', 'DESCRIPTION', 'AMOUNT']],
        body: options.expenses.length
          ? options.expenses.map((e) => [
              e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
              e.category,
              e.description,
              money(Number(e.amount || 0)),
            ])
          : [['No expenses in this period', '', '', '']],
        columnStyles: { 3: { halign: 'right' } },
      });
      y = sectionStart(10);
      sectionTitle(`TOTAL EXPENSES: ${money(totalExpenses)}`, y);
      (doc as DocWithTable).lastAutoTable = { finalY: y };
      y = sectionStart(10);
      sectionTitle(`NET (SALES - EXPENSES): ${money(totalRevenue - totalExpenses)}`, y);
    }

    const safeLabel = dateRangeLabel.replace(/\s+/g, '_');
    doc.save(`Sales_Report_${safeLabel}.pdf`);
  })();
}