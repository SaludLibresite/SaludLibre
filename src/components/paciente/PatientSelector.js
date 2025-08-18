import { useState, Fragment } from "react";
import { usePatientStoreHydrated } from "../../store/patientStore";
import { Menu, Transition } from "@headlessui/react";
import {
  UserIcon,
  ChevronDownIcon,
  CheckIcon,
  UserGroupIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PatientSelector({ className = "" }) {
  const {
    activePatient,
    allPatientsUnderCare,
    switchToPatient,
    getActivePatientDisplayName,
    isHydrated,
  } = usePatientStoreHydrated();

  const [isOpen, setIsOpen] = useState(false);

  const handlePatientSwitch = (patientId) => {
    switchToPatient(patientId);
    setIsOpen(false);
  };

  // Don't render if not hydrated, no active patient or no patients under care
  if (!isHydrated || !activePatient || allPatientsUnderCare.length <= 1) {
    return null;
  }

  const activeDisplayName = getActivePatientDisplayName();

  return (
    <div className={`relative ${className}`}>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500">
            <div className="flex items-center space-x-2">
              {activePatient.isPrimary ? (
                <UserIcon className="h-4 w-4 text-amber-600" />
              ) : (
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-left">
                <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                  {activeDisplayName}
                </div>
                {!activePatient.isPrimary && (
                  <div className="text-xs text-gray-500">
                    Viendo como familiar
                  </div>
                )}
              </span>
            </div>
            <ChevronDownIcon
              className="h-4 w-4 text-gray-500 ml-2"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Item>
            <div className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {/* Header */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <EllipsisHorizontalIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Cambiar vista de paciente
                    </span>
                  </div>
                </div>

                {/* Patient List */}
                <div className="max-h-64 overflow-y-auto">
                  {allPatientsUnderCare.map((patient) => (
                    <Menu.Item key={patient.id}>
                      {({ active }) => (
                        <button
                          onClick={() => handlePatientSwitch(patient.id)}
                          className={classNames(
                            active ? "bg-gray-100" : "",
                            "group flex w-full items-center px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                          )}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Avatar */}
                            <div
                              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                patient.isPrimary
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {patient.isPrimary ? (
                                <UserIcon className="h-4 w-4" />
                              ) : (
                                <UserGroupIcon className="h-4 w-4" />
                              )}
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {patient.name}
                                </p>
                                {patient.isPrimary && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.relationship}
                                {patient.dateOfBirth && (
                                  <span className="ml-2">
                                    • {calculateAge(patient.dateOfBirth)} años
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Active Indicator */}
                            {activePatient.id === patient.id && (
                              <CheckIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-600">
                    {allPatientsUnderCare.length === 1
                      ? "1 paciente bajo su cuidado"
                      : `${allPatientsUnderCare.length} pacientes bajo su cuidado`}
                  </p>
                </div>
              </div>
            </div>
          </Menu.Item>
        </Transition>
      </Menu>
    </div>
  );
}

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return "";

  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
