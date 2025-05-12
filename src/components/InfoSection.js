import Image from "next/image";
import React from "react";
export default function InfoSection({ image, title, points, firstTitle, firstDescription, lastTitle, lastDescription }) {
  return (
    <section className="items-center gap-8 py-10">
      <div className="mb-14 text-center">
        <h2 className="text-2xl font-bold mb-2">{firstTitle}</h2>
        <p className="text-lg text-slate-600">
          {firstDescription}
        </p>
      </div>
      <div className="mb-14 flex flex-col md:flex-row">
        <div className="w-full  md:w-1/2 flex justify-center">
          <Image
            src={image}
            alt="info"
            width={320}
            height={220}
            className="rounded-xl shadow-md object-cover"
          />
        </div>
        <div className=" w-full md:w-1/2">
          <h2 className="mr-12 text-2xl font-bold mb-4">{title}</h2>
          <ul className="list-disc pl-5 space-y-2 text-lg">
            {points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-bold mb-2">{lastTitle}</h2>
        <p className="text-lg text-slate-600">
          {lastDescription}
        </p>
      </div>
    </section>
  );
}
