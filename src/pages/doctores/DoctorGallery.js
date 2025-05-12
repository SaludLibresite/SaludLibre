export default function DoctorGallery({ images }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 w-full my-4">
      <h3 className="font-bold text-lg mb-3 text-blue-800">Galería de trabajo</h3>
      <div className="flex gap-4 justify-center flex-wrap">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`trabajo-${i}`}
            className="w-36 h-24 object-cover rounded-lg shadow border"
          />
        ))}
      </div>
    </div>
  );
} 