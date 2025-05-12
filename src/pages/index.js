import HeroCarousel from "../components/HeroCarousel";
import InfoSection from "../components/InfoSection";
import StatsSection from "../components/StatsSection";
import GallerySection from "../components/GallerySection";
import FAQSection from "../components/FAQSection";
import NavBar from "../components/NavBar";
import React from "react";

export default function Home() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="w-full mx-auto">
        <NavBar
          logo="/img/logo-hospital.png"
          links={[
            { href: "#", label: "Link 1" },
            { href: "doctores", label: "Doctors" },
            { href: "#", label: "Link 3" },
            { href: "#", label: "Link 4" },
            { href: "#", label: "Link 5" },
          ]}
          button={{ text: "Contacto", onClick: () => alert("Contacto") }}
        />
        <div className="pb-4">
          <HeroCarousel
            images={[
              "/img/doctor-1.jpg",
              "/img/doctor-2.jpg",
              "/img/doctor-3.jpg",
            ]}
            searchPlaceholder="Buscar doctor, especialidad, área..."
            onSearch={(q) => alert(`Buscar: ${q}`)}
          />
        </div>
        <InfoSection
          firstTitle="Nuestro impacto en la salud"
          firstDescription="Conoce algunos de los logros y cifras que nos distinguen como hospital líder en la región."
          image="/img/doctor-4.jpg"
          title="Siempre estamos buscando mejorar la salud de nuestra comunidad"
          points={[
            "Atención médica de calidad y personalizada.",
            "Equipo médico altamente calificado.",
            "Tecnología de punta en diagnóstico y tratamiento.",
            "Compromiso con la innovación y la investigación.",
          ]}
          lastTitle="Nuestro compromiso con la salud"
          lastDescription="Nos esforzamos por ofrecer un servicio médico de alta calidad y un ambiente cómodo para nuestros pacientes."
        />
          <StatsSection
            stats={[
              {
                value: "250+",
                label: "Doctores",
                description: "Especialistas en más de 30 áreas médicas.",
              },
              {
                value: "50,000+",
                label: "Pacientes atendidos",
                description: "Confían cada año en nuestro hospital.",
                darkness: true,
              },
              {
                value: "4.9/5",
                label: "Satisfacción",
                description: "Calificación promedio de nuestros pacientes.",
                highlight: true,
              },
            ]}
          />
        <GallerySection
          items={[
            {
              image: "/img/doctor-1.jpg",
              title: "Pediatría",
              description: "Cuidado integral para los más pequeños.",
            },
            {
              image: "/img/doctor-2.jpg",
              title: "Investigación",
              description: "Líderes en innovación médica.",
            },
            {
              image: "/img/doctor-6.jpg",
              title: "Neurología",
              description: "Diagnóstico avanzado en neurociencias.",
            },
            {
              image: "/img/doctor-7.jpg",
              title: "Atención personalizada",
              description: "Cada paciente es único para nosotros.",
            },
          ]}
        />
        <FAQSection
          faqs={[
            {
              question: "¿Cómo puedo agendar una cita?",
              answer:
                "Puedes agendar una cita desde nuestro sitio web o llamando a nuestro número de atención.",
            },
            {
              question: "¿Qué especialidades ofrecen?",
              answer:
                "Contamos con más de 30 especialidades médicas, desde cardiología hasta pediatría.",
            },
            {
              question: "¿Aceptan seguros médicos?",
              answer:
                "Sí, trabajamos con la mayoría de los seguros médicos nacionales e internacionales.",
            },
            {
              question: "¿Dónde están ubicados?",
              answer:
                "Estamos ubicados en el centro de la ciudad, con fácil acceso y estacionamiento.",
            },
          ]}
        />
      </div>
    </div>
  );
}
