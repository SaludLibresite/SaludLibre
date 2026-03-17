import HeroCarousel from '@/components/home/HeroCarousel';
import InfoSection from '@/components/home/InfoSection';
import GallerySection from '@/components/home/GallerySection';
import StatsSection from '@/components/home/StatsSection';
import LearnPlatformSection from '@/components/home/LearnPlatformSection';
import FAQSection from '@/components/home/FAQSection';

export default function Home() {
  return (
    <>
      <HeroCarousel />

      <InfoSection
        image="/img/imagen-5-doctores.jpg"
        firstTitle="Una plataforma integral"
        firstDescription="Diseñada para conectar pacientes y profesionales de la salud de forma simple y eficiente."
        title="Servicios para tu bienestar"
        points={[
          {
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            name: 'Agendamiento online',
            description: 'Reservá turnos de forma rápida y sencilla, eligiendo el día y horario que más te convenga.',
          },
          {
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            name: 'Historial médico digital',
            description: 'Almacená y consultá todos tus datos médicos de manera segura desde cualquier dispositivo.',
          },
          {
            icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
            name: 'Videoconsultas',
            description: 'Realizá consultas médicas desde la comodidad de tu hogar con nuestro sistema de video integrado.',
          },
          {
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            name: 'Recetas digitales',
            description: 'Recibí recetas médicas en formato digital, accesibles en cualquier momento.',
          },
        ]}
        lastTitle="Seguridad garantizada"
        lastDescription="Toda tu información médica está protegida con encriptación de nivel bancario y cumplimiento total de regulaciones argentinas."
      />

      <GallerySection />

      <StatsSection />

      <LearnPlatformSection />

      <FAQSection />
    </>
  );
}
