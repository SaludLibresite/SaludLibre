import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export function LoginButton() {
  const { currentUser } = useAuth();

  return (
    <Link href="/paciente" className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
      {currentUser ? currentUser.email : "Iniciar sesión"}
    </Link>
  );
}
