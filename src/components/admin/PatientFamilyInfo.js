import { useState } from "react";
import {
  UserGroupIcon,
  UserIcon,
  HeartIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

export default function PatientFamilyInfo({ patient, familyMembers = [] }) {
  const [showFamilyDetails, setShowFamilyDetails] = useState(false);

  // Check if this patient is a family member
  const isFamilyMember =
    patient.primaryPatientId && patient.primaryPatientId !== patient.id;

  // Find primary patient if this is a family member
  const primaryPatient = isFamilyMember
    ? familyMembers.find((member) => member.id === patient.primaryPatientId)
    : null;

  // Get family members for this patient (if primary) or siblings (if family member)
  const relatedFamilyMembers = isFamilyMember
    ? familyMembers.filter(
        (member) =>
          member.primaryPatientId === patient.primaryPatientId &&
          member.id !== patient.id
      )
    : familyMembers.filter((member) => member.primaryPatientId === patient.id);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return `${age} años`;
  };

  if (!isFamilyMember && relatedFamilyMembers.length === 0) {
    // Primary patient with no family members
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Paciente principal • Sin familiares registrados
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      {isFamilyMember ? (
        /* This patient is a family member */
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Familiar a cargo de paciente principal
            </span>
          </div>

          {primaryPatient && (
            <div className="bg-white rounded-md p-3 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {primaryPatient.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Responsable de la cuenta
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {patient.relationship || "Familiar"}
                  </div>
                </div>
              </div>

              {primaryPatient.phone && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
                  <PhoneIcon className="h-3 w-3" />
                  <span>{primaryPatient.phone}</span>
                </div>
              )}

              {primaryPatient.email && (
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-600">
                  <EnvelopeIcon className="h-3 w-3" />
                  <span>{primaryPatient.email}</span>
                </div>
              )}
            </div>
          )}

          {relatedFamilyMembers.length > 0 && (
            <div>
              <button
                onClick={() => setShowFamilyDetails(!showFamilyDetails)}
                className="flex items-center space-x-2 text-sm text-amber-700 hover:text-amber-800 transition-colors"
              >
                {showFamilyDetails ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
                <span>
                  {relatedFamilyMembers.length} familiar
                  {relatedFamilyMembers.length > 1 ? "es" : ""} adicional
                  {relatedFamilyMembers.length > 1 ? "es" : ""}
                </span>
              </button>

              {showFamilyDetails && (
                <div className="mt-2 space-y-2">
                  {relatedFamilyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-md p-2 border border-amber-200"
                    >
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {member.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {member.relationship}
                        </span>
                        {member.dateOfBirth && (
                          <span className="text-xs text-gray-500">
                            • {calculateAge(member.dateOfBirth)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* This is a primary patient with family members */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Paciente principal
              </span>
            </div>
            <div className="text-xs text-amber-700">
              {relatedFamilyMembers.length} familiar
              {relatedFamilyMembers.length > 1 ? "es" : ""} a cargo
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowFamilyDetails(!showFamilyDetails)}
              className="flex items-center space-x-2 text-sm text-amber-700 hover:text-amber-800 transition-colors"
            >
              {showFamilyDetails ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
              <span>Ver familiares a cargo</span>
            </button>

            {showFamilyDetails && (
              <div className="mt-2 space-y-2">
                {relatedFamilyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-md p-3 border border-amber-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <HeartIcon className="h-3 w-3 text-pink-400" />
                            <span>{member.relationship}</span>
                            {member.dateOfBirth && (
                              <>
                                <span>•</span>
                                <CalendarIcon className="h-3 w-3" />
                                <span>{calculateAge(member.dateOfBirth)}</span>
                              </>
                            )}
                            {member.gender && (
                              <>
                                <span>•</span>
                                <span>{member.gender}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(member.phone || member.email) && (
                      <div className="mt-2 space-y-1">
                        {member.phone && (
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <PhoneIcon className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <EnvelopeIcon className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {member.allergies && (
                      <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
                        <div className="text-xs text-red-700">
                          <strong>Alergias:</strong> {member.allergies}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
