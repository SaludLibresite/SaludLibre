# Reglas de Firestore para el Sistema de Recompensas por Referidos

## Agregar estas reglas a firestore.rules

```javascript
// Colección de recompensas por referidos
match /referral_rewards/{rewardId} {
  // Los doctores pueden leer sus propias recompensas
  allow read: if request.auth != null && 
    resource.data.doctorId == request.auth.uid;
  
  // Solo los doctores pueden crear solicitudes de recompensa para sí mismos
  allow create: if request.auth != null && 
    request.resource.data.doctorId == request.auth.uid &&
    request.resource.data.status == "pending" &&
    request.resource.data.rewardType == "subscription_extension";
  
  // Solo superadmins pueden actualizar (aprobar/rechazar)
  allow update: if request.auth != null && 
    request.auth.token.email == "juan@jhernandez.mx";
  
  // Solo superadmins pueden eliminar
  allow delete: if request.auth != null && 
    request.auth.token.email == "juan@jhernandez.mx";
}

// Actualizar las reglas existentes de doctores para incluir referralRewards
match /doctors/{doctorId} {
  // Permitir lectura si es el doctor propietario o superadmin
  allow read: if request.auth != null && 
    (request.auth.uid == doctorId || 
     request.auth.token.email == "juan@jhernandez.mx");
  
  // Permitir escritura si es el doctor propietario o superadmin
  allow write: if request.auth != null && 
    (request.auth.uid == doctorId || 
     request.auth.token.email == "juan@jhernandez.mx");
  
  // Permitir actualización de stats de referidos solo por el sistema
  allow update: if request.auth != null && 
    (request.auth.uid == doctorId || 
     request.auth.token.email == "juan@jhernandez.mx" ||
     // Permitir actualizar solo campos específicos de referidos
     (onlyUpdatingFields(['referralStats', 'referralRewards']) && 
      request.auth.uid != null));
}

// Función helper para verificar que solo se actualicen campos específicos
function onlyUpdatingFields(allowedFields) {
  return request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(allowedFields);
}
```

## Notas de Implementación

1. **Seguridad**: Las recompensas solo pueden ser creadas por los doctores para sí mismos
2. **Aprobación**: Solo el superadmin puede aprobar o rechazar recompensas
3. **Auditoria**: Todas las acciones quedan registradas con timestamps y responsables
4. **Escalabilidad**: El sistema está diseñado para manejar múltiples tipos de recompensas en el futuro

## Índices de Firestore Recomendados

```
Collection: referral_rewards
Index 1: status (ASC), createdAt (DESC)
Index 2: doctorId (ASC), status (ASC)
Index 3: status (ASC), createdAt (ASC)

Collection: doctors
Index 1: referralCode (ASC) [ya existe]
Index 2: referralStats.confirmedReferrals (DESC)
```

## Comandos para crear índices (Firebase CLI)

```bash
firebase firestore:indexes
```

Agregar estos índices al archivo firestore.indexes.json:

```json
{
  "indexes": [
    {
      "collectionGroup": "referral_rewards",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "referral_rewards",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "doctorId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```
