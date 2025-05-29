import { useState } from "react";
import { calendarEvents } from "../../data/adminData";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1)); // April 2025
  const [view, setView] = useState("Mes");
  const [selectedTab, setSelectedTab] = useState("Calendario");

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Sample appointments for demonstration
  const appointmentsForDay = (day) => {
    if (day === 1) {
      return [
        { time: "8:00 AM", patient: "Sarah Johnson" },
        { time: "11:30 AM", patient: "Mike Peters" },
        { time: "2:30 PM", patient: "Emily Davis" },
      ];
    }
    return [];
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Agenda</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Cita</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex space-x-8">
          {["Agenda", "Calendario", "Lista"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-2 text-sm font-medium border-b-2 ${
                selectedTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMonth} {currentYear}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">
            Hoy
          </button>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Mes">Mes</option>
            <option value="Semana">Semana</option>
            <option value="Día">Día</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {days.map((day, index) => (
            <div
              key={index}
              className={`bg-white p-2 h-24 ${
                day ? "hover:bg-gray-50 cursor-pointer" : ""
              }`}
            >
              {day && (
                <>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {day}
                  </div>
                  <div className="space-y-1">
                    {appointmentsForDay(day).map((appointment, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                      >
                        <div className="font-medium">{appointment.time}</div>
                        <div>{appointment.patient}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
