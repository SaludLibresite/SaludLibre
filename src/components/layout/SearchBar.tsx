'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim())
      router.push(`/doctores?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-12">
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xl">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar doctor, especialidad, área..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-gray-100 text-gray-900 placeholder-gray-400 text-sm rounded-lg pl-9 pr-3 py-1.5 outline-none border border-gray-200 focus:border-[#4dbad9] focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#e8910f] hover:bg-[#d4830d] text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Separator */}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          {/* Ver Doctores link */}
          <Link
            href="/doctores"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-[#4dbad9] hover:text-[#011d2f] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="hidden sm:inline">Ver Doctores</span>
          </Link>

          {/* Separator */}
          <div className="hidden md:block w-px h-6 bg-gray-200" />

          {/* Especialidades link */}
          <Link
            href="/especialidades"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#011d2f] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Especialidades
          </Link>
        </div>
      </div>
    </div>
    {/* Spacer for fixed search bar */}
    <div className="h-12" />
    </>
  );
}
