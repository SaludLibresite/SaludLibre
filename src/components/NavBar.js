import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';

export default function NavBar({ logo, links, button }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-2 md:px-6">
        <div className="flex items-center gap-4">
          {logo && (
            <Link href="/">
              <Image src={logo} alt="Logo" width={48} height={48} className="object-contain cursor-pointer" />
            </Link>
          )}
        </div>
        {/* Desktop links */}
        <div className="hidden md:flex gap-6 flex-1 justify-center">
          {links && links.map((link, i) => (
            <a key={i} href={link.href} className="text-slate-700 hover:text-blue-600 font-medium transition text-base px-2 py-1 rounded-lg hover:bg-blue-50">
              {link.label}
            </a>
          ))}
        </div>
        {/* Botón derecho */}
        <div className="flex items-center gap-2">
          {button && (
            <button
              className="bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold px-5 py-2 rounded-lg shadow transition"
              onClick={button.onClick}
            >
              {button.text}
            </button>
          )}
          {/* Hamburguesa */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 ml-2"
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
          >
            <span className={`block w-6 h-0.5 bg-slate-700 mb-1 transition-all ${open ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-slate-700 mb-1 transition-all ${open ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-slate-700 transition-all ${open ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6 gap-6">
          <div className="flex items-center justify-between mb-6">
            {logo && (
              <Link href="/">
                <Image src={logo} alt="Logo" width={40} height={40} className="object-contain cursor-pointer" />
              </Link>
            )}
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {links && links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="text-slate-700 hover:text-blue-600 font-medium text-lg px-2 py-2 rounded-lg hover:bg-blue-50 transition"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
          {button && (
            <button
              className="bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold px-5 py-2 rounded-lg shadow transition w-full"
              onClick={() => { setOpen(false); button.onClick && button.onClick(); }}
            >
              {button.text}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 