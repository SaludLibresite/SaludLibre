import React, { useState } from 'react';

export default function AgendarCita({ onSubmit }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (onSubmit) onSubmit({ nombre, fecha, descripcion });
  }

  return (
    <form className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-blue-800 mb-2">Agendar una cita</h2>
      <input
        className="border rounded-lg px-3 py-2"
        placeholder="Nombre"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        required
      />
      <input
        className="border rounded-lg px-3 py-2"
        type="date"
        value={fecha}
        onChange={e => setFecha(e.target.value)}
        required
      />
      <textarea
        className="border rounded-lg px-3 py-2"
        placeholder="Descripción de la consulta"
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        rows={3}
        required
      />
      <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg mt-2 transition">Agendar cita</button>
    </form>
  );
} 