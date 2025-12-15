# Sistema de Recompensas por Referidos - Documentación

## 📋 Resumen del Sistema

El sistema de recompensas por referidos permite a los doctores ganar días gratis de suscripción por cada 3 doctores que refieran exitosamente a la plataforma.

### 🎯 Lógica Principal
- **3 referidos confirmados = 1 mes gratis (30 días)**
- **Aprobación manual del superadmin** para cada recompensa
- **Extensión automática** de suscripciones existentes o creación de nuevas

## 🏗️ Arquitectura del Sistema

### 1. Colecciones de Firebase
- `doctors` - Información del doctor con stats de referidos
- `referrals` - Registro de referidos
- `referral_rewards` - Solicitudes de recompensas
- `subscriptions` - Suscripciones de los doctores

### 2. Estructura de Datos

#### Doctor Document (`doctors/{doctorId}`)
```javascript
{
  // ... campos existentes
  referralCode: "DOC1234",
  referralStats: {
    totalReferrals: 5,
    pendingReferrals: 1,
    confirmedReferrals: 4,
    lastReferralDate: Date
  },
  referralRewards: {
    eligibleRewards: 1,      // Math.floor(confirmedReferrals / 3)
    pendingRewards: 1,       // Recompensas solicitadas pendientes
    approvedRewards: 0,      // Recompensas ya aprobadas
    totalRewardsEarned: 0    // Total días gratis ganados
  }
}
```

#### Referral Reward Document (`referral_rewards/{rewardId}`)
```javascript
{
  doctorId: "doctorId",
  rewardType: "subscription_extension",
  rewardValue: 30,  // días
  status: "pending", // pending, approved, rejected
  createdAt: Date,
  approvedAt: Date,
  approvedBy: "superadminId",
  rejectedAt: Date,
  rejectedBy: "superadminId",
  rejectionReason: "string"
}
```

## 🔧 Funcionalidades Implementadas

### Para Doctores (`/admin/referrals`)
1. **Generación de código de referido**
2. **Visualización de referidos** (pendientes y confirmados)
3. **Dashboard de recompensas** mostrando:
   - Recompensas ganadas (cada 3 referidos)
   - Recompensas pendientes de aprobación
   - Recompensas aprobadas
   - Total días gratis ganados
4. **Solicitud de recompensas** con botón cuando sea elegible
5. **Notificación en dashboard** cuando tenga recompensas disponibles

### Para Superadmin (`/superadmin/referral-rewards`)
1. **Panel de gestión completo** con dos pestañas:
   - Recompensas pendientes
   - Resumen general de todos los doctores
2. **Estadísticas generales**:
   - Doctores con referidos
   - Recompensas pendientes
   - Total referidos confirmados
   - Días gratis otorgados
3. **Aprobación de recompensas** con:
   - Extensión automática de suscripciones existentes
   - Creación de nuevas suscripciones de 30 días
4. **Rechazo de recompensas** con motivo opcional

## 🚀 Flujo de Trabajo

### 1. Doctor Refiere a Otro Doctor
```
Doctor A genera código → Doctor B se registra con código → 
Referido queda "pending" → Doctor B completa perfil → 
Referido se marca "confirmed" → Se actualizan stats automáticamente
```

### 2. Doctor Solicita Recompensa
```
Doctor tiene ≥3 referidos confirmados → 
Aparece notificación en dashboard → 
Doctor solicita recompensa → 
Solicitud queda "pending" para superadmin
```

### 3. Superadmin Aprueba Recompensa
```
Superadmin ve solicitud → Revisa información → 
Aprueba recompensa → Sistema extiende/crea suscripción → 
Doctor recibe 30 días gratis
```

## 📁 Archivos Modificados/Creados

### Nuevos Archivos
- `/pages/superadmin/referral-rewards.js`
- `/components/admin/ReferralRewardNotification.js`
- `/REFERRAL_REWARDS_FIREBASE_RULES.md`

### Archivos Modificados
- `/lib/referralsService.js` - Agregadas funciones de recompensas
- `/lib/subscriptionsService.js` - Agregada función de extensión
- `/components/admin/ReferralsList.js` - Agregada sección de recompensas
- `/components/superadmin/SuperAdminLayout.js` - Agregado enlace de recompensas
- `/pages/admin/index.js` - Agregada notificación de recompensas

## 🎨 Componentes UI

### ReferralRewardNotification
- Aparece en dashboard del doctor
- Muestra recompensas disponibles
- Permite solicitar recompensa directamente
- Se oculta automáticamente después de solicitar

### Sección de Recompensas en ReferralsList
- Grid con estadísticas de recompensas
- Botón para solicitar cuando sea elegible
- Estado de recompensas pendientes
- Explicación clara del sistema (3 referidos = 1 mes)

### Panel de Superadmin
- Diseño responsive con tabs
- Cards de estadísticas generales
- Lista detallada de recompensas pendientes
- Botones de acción (aprobar/rechazar)
- Resumen completo de todos los doctores

## 🔒 Seguridad

### Reglas de Firestore
- Doctores solo pueden crear recompensas para sí mismos
- Solo superadmin puede aprobar/rechazar
- Lecturas limitadas a datos propios
- Auditoría completa de todas las acciones

### Validaciones
- Verificación de elegibilidad antes de crear solicitud
- Validación de estado de suscripción antes de extender
- Prevención de solicitudes duplicadas
- Verificación de permisos en cada operación

## 🧪 Testing y Validación

### Casos de Prueba Recomendados
1. **Doctor con 3 referidos confirmados** puede solicitar recompensa
2. **Doctor con suscripción activa** - se extiende correctamente
3. **Doctor sin suscripción** - se crea nueva suscripción
4. **Superadmin puede aprobar** y rechazar recompensas
5. **Notificaciones aparecen** cuando corresponde
6. **Stats se actualizan** correctamente

### Datos de Prueba
```javascript
// Doctor con referidos para testing
{
  referralStats: { confirmedReferrals: 6 }, // Debería tener 2 recompensas
  referralRewards: { eligibleRewards: 1, pendingRewards: 0, approvedRewards: 0 }
}
```

## 📊 Métricas y Monitoreo

### KPIs Importantes
- Número de referidos por doctor
- Tasa de conversión de referidos (pending → confirmed)
- Recompensas solicitadas vs aprobadas
- Días gratis otorgados por período
- Doctores más activos en referidos

### Posibles Mejoras Futuras
1. **Automatización** de aprobaciones para doctores verificados
2. **Niveles de recompensas** (más referidos = mayores beneficios)
3. **Dashboard analytics** con gráficos y tendencias
4. **Notificaciones por email** para recompensas
5. **Sistema de badges** para top referrers
6. **API webhooks** para integraciones externas

## 🚨 Consideraciones Importantes

### Escalabilidad
- Sistema diseñado para manejar miles de referidos
- Índices optimizados para consultas frecuentes
- Paginación en listas largas

### Mantenimiento
- Logs detallados para debugging
- Validaciones en frontend y backend
- Manejo de errores robusto
- Rollback capabilities

### UX/UI
- Explicaciones claras del sistema
- Feedback inmediato en todas las acciones
- Estados de loading apropiados
- Diseño mobile-responsive
