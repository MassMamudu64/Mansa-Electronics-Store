'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  q: string;
  a: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: number;
}

export default function Accordion({ items, defaultOpen = -1 }: AccordionProps) {
  const [open, setOpen] = useState<number>(defaultOpen);

  return (
    <div className="divide-y divide-charcoal-100 overflow-hidden rounded-2xl border border-charcoal-100 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-charcoal-50/60 sm:px-6 sm:py-5"
            >
              <span className="text-sm font-semibold text-charcoal-900 sm:text-base">
                {item.q}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-charcoal-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-charcoal-900' : ''
                }`}
              />
            </button>
            <div
              id={`faq-panel-${i}`}
              role="region"
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-charcoal-600 sm:px-6 sm:pb-6 sm:text-[15px]"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
