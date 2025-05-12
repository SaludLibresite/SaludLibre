import { useState } from 'react';
import React from 'react';

export default function FAQSection({ faqs }) {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-10 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Preguntas frecuentes</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 font-semibold bg-slate-100 hover:bg-slate-200 transition flex justify-between items-center"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {faq.question}
              <span>{open === i ? '-' : '+'}</span>
            </button>
            {open === i && (
              <div className="px-4 py-3 bg-white text-slate-700 border-t animate-fade-in">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
} 