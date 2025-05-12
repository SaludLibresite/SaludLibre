import Image from 'next/image';
import React from 'react';
export default function HeroCarousel({ images, onSearch, searchPlaceholder }) {
  const [current, setCurrent] = React.useState(0);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden shadow-lg">
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <Image src={img} alt={`slide-${idx}`} layout="fill" objectFit="cover" />
        </div>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg text-center">Encuentra tu médico ideal</h1>
        <form
          className="flex w-full max-w-md"
          onSubmit={e => { e.preventDefault(); onSearch?.(query); }}
        >
          <input
            className="flex-1 bg-white px-4 py-2 rounded-l-lg outline-none text-lg"
            type="text"
            placeholder={searchPlaceholder || 'Buscar doctor, especialidad...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="bg-yellow-400 px-6 py-2 rounded-r-lg font-semibold text-black hover:bg-yellow-300 transition" type="submit">
            Buscar
          </button>
        </form>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === current ? 'bg-yellow-400' : 'bg-white/60'}`}
            onClick={() => setCurrent(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
    
  );
} 