import React from 'react';

export default function StatsSection({ stats }) {
  return (
    <section className="py-10 m-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className={`rounded-xl p-8 shadow-md ${stat.highlight ? 'bg-yellow-300 text-black' : stat.darkness ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}>
          <div className="text-3xl font-bold mb-2">{stat.value}</div>
          <div className="text-lg font-semibold mb-1">{stat.label}</div>
          <div className="text-base">{stat.description}</div>
        </div>
      ))}
    </section>
  );
} 