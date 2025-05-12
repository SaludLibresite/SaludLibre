import Image from 'next/image';
import React from 'react';

export default function GallerySection({ items }) {
  return (
    <section className="py-10 ml-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl overflow-hidden shadow-md bg-white flex flex-col">
          <Image src={item.image} alt={item.title} width={400} height={250} className="object-cover h-48 w-full" />
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg mb-2">{item.title}</h3>
            <p className="text-slate-600 text-base flex-1">{item.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
} 