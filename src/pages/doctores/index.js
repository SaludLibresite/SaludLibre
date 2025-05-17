import React, { useState } from 'react';
import NavBar from '../../components/NavBar';
import doctoresData from '../../data/doctores.json';

function DoctorCard({ doctor, onView, onContact }) {
  const getRankColor = (rank) => {
    switch (rank) {
      case 'VIP':
        return 'border-amber-400';
      case 'Intermedio':
        return 'border-blue-400';
      case 'Normal':
        return 'border-red-400';
      default:
        return 'border-slate-200';
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 'VIP':
        return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white';
      case 'Intermedio':
        return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white';
      case 'Normal':
        return 'bg-gradient-to-r from-red-400 to-red-500 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4 border-2 ${getRankColor(doctor.rango)} hover:shadow-2xl transition-all duration-300 group relative overflow-hidden transform hover:-translate-y-1`}>
      {/* Rank Badge */}
      <div className={`absolute top-4 right-4 ${getRankBadge(doctor.rango)} text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10`}>
        {doctor.rango || 'Normal'}
      </div>
      
      {/* Doctor Image with Gradient Overlay */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <img 
          src={doctor.imagen} 
          alt={doctor.nombre} 
          className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 group-hover:scale-105 transition-transform duration-300 shadow-md" 
        />
      </div>

      {/* Doctor Info */}
      <div className="text-center space-y-2 w-full">
        <h3 className="font-bold text-xl text-blue-900 group-hover:text-blue-700 transition-colors duration-300">
          Dr. {doctor.nombre}
        </h3>
        <span className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full">
          {doctor.especialidad}
        </span>
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 min-h-[4.5rem]">
          {doctor.descripcion}
        </p>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-2 w-full text-sm text-slate-500 border-t border-slate-100 pt-3 mt-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-blue-500">📞</span>
          <span className="truncate">{doctor.telefono}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-blue-500">✉️</span>
          <span className="truncate">{doctor.email}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-2 w-full">
        <button 
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          onClick={() => onView(doctor)}
        >
          Ver perfil
        </button>
        <button 
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
          onClick={() => onContact(doctor)}
        >
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-slate-100 min-h-screen">
      <NavBar
        logo="/images/logo-hospital.png"
        links={[
          { href: '/', label: 'Inicio' },
          { href: '/doctores', label: 'Doctores' },
        ]}
        button={{ text: 'Contacto', onClick: () => alert('Contacto') }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
            Encuentra a tu doctor ideal
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Filtra por nombre o especialidad y descubre a los mejores especialistas para ti.
          </p>
          <div className="relative max-w-2xl mx-auto">
            <input
              className="w-full px-6 py-3 rounded-xl outline-none text-lg border-2 border-blue-200 shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all duration-300"
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
        </div>

        <FiltroNav categorias={categorias} selected={categoria} onSelect={setCategoria} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filtered.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onView={d => window.location.href = `/doctores/${d.slug}`}
              onContact={d => alert(`Contactar a ${d.nombre}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-slate-600">No se encontraron doctores.</p>
              <p className="text-slate-500 mt-2">Intenta con otros términos de búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
