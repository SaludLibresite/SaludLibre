'use client';

import Link from 'next/link';

export default function SubscriptionFailurePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Pago rechazado</h1>
        <p className="mt-3 text-gray-500">
          No se pudo procesar tu pago. Verificá los datos de tu medio de pago e intentá nuevamente.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/admin/subscription"
            className="inline-block rounded-xl bg-[#4dbad9] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3da8c5]"
          >
            Reintentar
          </Link>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            Volver al panel
          </Link>
        </div>
      </div>
    </div>
  );
}
