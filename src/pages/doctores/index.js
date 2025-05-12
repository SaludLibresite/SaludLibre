import React, { useState } from 'react';
import NavBar from '../../components/NavBar';
import doctoresData from '../../data/doctores.json';

function DoctorCard({ doctor, onView, onContact }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col items-center gap-3 border border-slate-100 hover:shadow-2xl transition group relative overflow-hidden">
      <img src={doctor.imagen} alt={doctor.nombre} className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 group-hover:scale-105 transition mb-2" />
      <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{doctor.especialidad}</span>
      <h3 className="font-bold text-lg text-center group-hover:text-blue-700 transition">{doctor.nombre}</h3>
      <p className="text-slate-500 text-center text-sm mb-2 line-clamp-2">{doctor.descripcion}</p>
      <div className="flex gap-2 mt-auto w-full justify-center">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium shadow transition" onClick={() => onView(doctor)}>
          Ver perfil
        </button>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium shadow transition" onClick={() => onContact(doctor)}>
          Contactar
        </button>
      </div>
    </div>
  );
}

function FiltroNav({ categorias, selected, onSelect }) {
  return (
    <nav className="flex flex-wrap gap-2 justify-center py-4">
      <button
        className={`px-4 py-1.5 rounded-full border font-semibold shadow-sm ${selected === '' ? 'bg-blue-500 text-white' : 'bg-white text-slate-700 hover:bg-blue-50'}`}
        onClick={() => onSelect('')}
      >
        Todos
      </button>
      {categorias.map(cat => (
        <button
          key={cat}
          className={`px-4 py-1.5 rounded-full border font-semibold shadow-sm ${selected === cat ? 'bg-blue-500 text-white' : 'bg-white text-slate-700 hover:bg-blue-50'}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}

export default function DoctoresPage() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const categorias = Array.from(new Set(doctoresData.map(d => d.especialidad)));

  const filtered = doctoresData.filter(d =>
    (d.nombre.toLowerCase().includes(search.toLowerCase()) ||
      d.especialidad.toLowerCase().includes(search.toLowerCase())) &&
    (categoria === '' || d.especialidad === categoria)
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-100 min-h-screen">
      <NavBar
        logo="/images/logo-hospital.png"
        links={[
          { href: '/', label: 'Inicio' },
          { href: '/doctores', label: 'Doctores' },
        ]}
        button={{ text: 'Contacto', onClick: () => alert('Contacto') }}
      />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-extrabold mb-2 text-center text-blue-900">Encuentra a tu doctor ideal</h1>
        <p className="text-center text-slate-500 mb-6">Filtra por nombre o especialidad y descubre a los mejores especialistas para ti.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
          <input
            className="flex-1 px-4 py-2 rounded-lg outline-none text-lg border border-blue-200 shadow-sm focus:ring-2 focus:ring-blue-200"
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <FiltroNav categorias={categorias} selected={categoria} onSelect={setCategoria} />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-4">
          {filtered.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onView={d => window.location.href = `/doctores/${d.slug}`}
              onContact={d => alert(`Contactar a ${d.nombre}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-8">No se encontraron doctores.</div>
          )}
        </div>
      </div>
    </div>
  );
}
