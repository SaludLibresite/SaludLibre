import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function StatsSection() {
  return (
    <div className=" py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Comprometidos con la excelencia en atención médica
          </h2>
          <p className="mt-6 text-base/7 text-gray-600">
            Nuestro enfoque se centra en brindar la mejor atención médica
            posible, con profesionales altamente capacitados y tecnología de
            vanguardia para cuidar tu salud y la de tu familia.
          </p>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl flex-col gap-8 lg:mx-0 lg:mt-20 lg:max-w-none lg:flex-row lg:items-end">
          <div className="flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-gray-50 p-8 sm:w-3/4 sm:max-w-md sm:flex-row-reverse sm:items-end lg:w-72 lg:max-w-none lg:flex-none lg:flex-col lg:items-start">
            <p className="flex-none text-3xl font-bold tracking-tight text-gray-900">
              250k+
            </p>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
              <p className="text-lg font-semibold tracking-tight text-gray-900">
                Pacientes atendidos
              </p>
              <p className="mt-2 text-base/7 text-gray-600">
                Más de 250,000 pacientes han confiado en nuestra atención médica
                de calidad.
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-gray-900 p-8 sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-sm lg:flex-auto lg:flex-col lg:items-start lg:gap-y-44">
            <p className="flex-none text-3xl font-bold tracking-tight text-white">
              98%
            </p>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
              <p className="text-lg font-semibold tracking-tight text-white">
                Satisfacción del paciente
              </p>
              <p className="mt-2 text-base/7 text-gray-400">
                Nuestros pacientes reportan altos niveles de satisfacción con
                nuestros servicios médicos especializados.
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse justify-between gap-x-16 gap-y-8 rounded-2xl bg-indigo-600 p-8 sm:w-11/12 sm:max-w-xl sm:flex-row-reverse sm:items-end lg:w-full lg:max-w-none lg:flex-auto lg:flex-col lg:items-start lg:gap-y-28">
            <p className="flex-none text-3xl font-bold tracking-tight text-white">
              50+
            </p>
            <div className="sm:w-80 sm:shrink lg:w-auto lg:flex-none">
              <p className="text-lg font-semibold tracking-tight text-white">
                Especialidades médicas
              </p>
              <p className="mt-2 text-base/7 text-indigo-200">
                Contamos con más de 50 especialidades médicas para cubrir todas
                tus necesidades de salud y bienestar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
