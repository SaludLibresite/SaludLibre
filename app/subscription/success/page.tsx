'use client';

import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">¡Pago exitoso!</h1>
        <p className="mt-3 text-gray-500">
          Tu suscripción ha sido activada correctamente. Ya podés disfrutar de todas las funcionalidades de tu plan.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-xl bg-[#4dbad9] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3da8c5]"
        >
          Ir a mi panel
        </Link>
      </div>
    </div>
  );
}
