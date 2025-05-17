export default function DoctorInfo({ especialidad, horario }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-800">Especialidad:</span>
        <span className="text-blue-700 font-semibold">{especialidad}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-800">Horario:</span>
        <span className="text-slate-700">{horario}</span>
      </div>
    </div>
  );
} 