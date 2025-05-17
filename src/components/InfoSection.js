import Image from "next/image";
import React from "react";

export default function InfoSection({
  image,
  title,
  points,
  firstTitle,
  firstDescription,
  lastTitle,
  lastDescription,
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-4">
            {firstTitle}
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {firstDescription}
            hospital líder en la región.
          </p>
        </div>
        <div className="mx-auto grid max-w-2xl pl-16 grid-cols-1 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:ml-auto">
            <div className="lg:max-w-lg m-4">
              <h2 className="font-semibold text-2xl">{title}</h2>
              <dl className="mt-10 max-w-xl space-y-4 text-base/7 text-gray-600 lg:max-w-none">
                {points.map((point) => (
                  <div key={point.name} className="relative pl-9">
                    <dt className="inline font-semibold text-gray-900">
                      {point.name}
                    </dt>{" "}
                    <dd className="inline">{point.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="flex items-start justify-end lg:order-first">
            <Image
              alt="Product screenshot"
              src={image}
              width={2432}
              height={1442}
              className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
            />
          </div>
        </div>
        <div className="mt-14">
          <h2 className="text-2xl font-bold mb-2">{lastTitle}</h2>
          <p className="text-lg text-slate-600">{lastDescription}</p>
        </div>
      </div>
    </div>
  );
}
