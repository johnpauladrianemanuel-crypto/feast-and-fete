'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';

const REPORT_RANGES = ['1-15 Days', '1 Month', '2 Months', 'Export All'] as const;
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const productRows = Array.from({ length: 19 }, (_, index) => ({ id: index }));

export default function AdminReportsPage() {
  const [selectedRange, setSelectedRange] = useState<(typeof REPORT_RANGES)[number]>('1 Month');

  return (
    <div className="flex h-screen overflow-hidden bg-[#1d1b1a] text-[#f5ede0]">
      <div className="print:hidden">
        <AdminSidebar />
      </div>

      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <div className="print:hidden">
          <AdminTopbar />
        </div>

        <div className="mx-auto max-w-[1200px] px-6 py-6 print:px-0 print:py-0">
          <div className="mb-5 flex items-center justify-end print:hidden">
            <div className="inline-flex items-center overflow-hidden rounded-2xl border border-[#d4a017]/40 bg-[#2d221d] shadow-lg">
              <button
                type="button"
                className="flex items-center gap-2 border-r border-[#d4a017]/30 bg-[#d4a017] px-4 py-2.5 text-sm font-semibold text-[#1b110e] transition hover:brightness-105"
              >
                <Download size={16} aria-hidden="true" />
                <span>Export PDF ({selectedRange})</span>
              </button>
              <select
                aria-label="Select report range"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value as (typeof REPORT_RANGES)[number])}
                className="appearance-none bg-transparent px-3 py-2.5 pr-8 text-sm text-[#f5ede0] outline-none"
              >
                {REPORT_RANGES.map((range) => (
                  <option key={range} value={range} className="bg-[#2d221d] text-[#f5ede0]">
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mx-auto min-h-[11in] w-full max-w-[8.5in] bg-[#f7f7f6] px-[0.48in] py-[0.48in] text-[#1d1d1d] shadow-[0_16px_28px_rgba(0,0,0,0.18)] print:min-h-0 print:w-[8.5in] print:shadow-none print:bg-white">
            <div className="mb-4 flex items-start justify-between border-b-2 border-[#555] pb-3">
              <div className="pt-1">
                <h1 className="text-[27px] font-black uppercase leading-[1.2] tracking-[0.02em] text-[#555] print:text-[26px]">
                  Printable Sales Report
                </h1>
                <h2 className="text-[27px] font-black uppercase leading-[1.2] tracking-[0.02em] text-[#555] print:text-[26px]">
                  {selectedRange} Report Template
                </h2>
              </div>
              <img
                src="/assets/images/Logo123.png"
                alt="Feast & Fête logo"
                className="h-[76px] w-[76px] object-contain print:h-[68px] print:w-[68px]"
              />
            </div>

            <div className="grid grid-cols-[1.25fr_1.25fr_1.25fr_1.35fr] border border-black bg-[#cbd4de] text-[8px] font-bold uppercase tracking-wide">
              <div className="border-r border-black px-2 py-2 text-center">Report Range</div>
              <div className="border-r border-black px-2 py-2 text-center">Associate Name</div>
              <div className="border-r border-black px-2 py-2 text-center">Signature</div>
              <div className="px-2 py-2 text-center">Report Completion Date</div>
            </div>

            <div className="grid grid-cols-[1.25fr_1.25fr_1.25fr_1.35fr] border-x border-b border-black bg-white text-[10px]">
              <div className="border-r border-black px-2 py-2 text-center">{selectedRange}</div>
              <div className="border-r border-black px-2 py-2">&nbsp;</div>
              <div className="border-r border-black px-2 py-2">&nbsp;</div>
              <div className="px-2 py-2 text-center">X/XX/XX</div>
            </div>

            <div className="mt-6 border border-black">
              <div className="grid grid-cols-[2.3fr_repeat(7,1fr)_1.6fr] bg-[#cbd4de] text-[8px] font-bold uppercase tracking-wide">
                <div className="border-r border-black px-2 py-2 text-center">Customer / Order Items</div>
                {DAYS.map((day) => (
                  <div key={day} className="border-r border-black px-1 py-2 text-center">
                    {day}
                  </div>
                ))}
                <div className="px-2 py-2 text-center">Total</div>
              </div>

              {productRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[2.3fr_repeat(7,1fr)_1.6fr] border-t border-black bg-white text-[10px]"
                >
                  <div className="border-r border-black px-2 py-[5px] text-[#1d1d1d]">&nbsp;</div>
                  {DAYS.map((day) => (
                    <div key={`${row.id}-${day}`} className="border-r border-black px-1 py-[5px] text-center">
                      &nbsp;
                    </div>
                  ))}
                  <div className="px-1 py-[5px] text-center">&nbsp;</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

