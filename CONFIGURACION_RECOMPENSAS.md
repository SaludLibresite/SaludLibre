# 🎛️ Configuración del Sistema de Recompensas

## 📍 Archivo de Configuración Principal
a
**Ubicación:** `/src/lib/referralRewardsConfig.js`

Este archivo centraliza toda la configuración del sistema de recompensas, permitiendo cambios fáciles sin tocar el código principal.

## ⚙️ Configuraciones Disponibles

### 🎯 **Configuración Básica de Recompensas**

```javascript
// Cantidad de referidos necesarios para una recompensa
REFERRALS_PER_REWARD: 3,

// Días de suscripción gratis por recompensa  
REWARD_DAYS: 30,
```

**Para cambiar la lógica:** 
- Cambiar `REFERRALS_PER_REWARD: 5` = Cada 5 referidos ganará una recompensa
- Cambiar `REWARD_DAYS: 45` = Cada recompensa dará 45 días gratis

### 🎨 **Configuración de Interfaz**

```javascript
PROGRESS_COLORS: {
  incomplete: "bg-gray-200",    // Color cuando no hay progreso
  progress: "bg-yellow-400",    // Color de progreso intermedio
  complete: "bg-green-500",     // Color cuando está completo
}
```

### 📢 **Mensajes Dinámicos**

```javascript
PROGRESS_MESSAGES: {
  0: "Comienza refiriendo doctores para ganar recompensas",
  1: "¡Excelente! Solo necesitas 2 referidos más", 
  2: "¡Casi ahí! Solo 1 referido más para tu recompensa",
  3: "🎉 ¡Recompensa disponible! Solicítala ahora",
}
```

### 🏆 **Sistema de Niveles (Futuro)**

```javascript
REWARD_TIERS: [
  {
    referrals: 3,
    reward_days: 30,
    title: "Bronce",
    description: "1 mes gratis"
  },
  {
    referrals: 6, 
    reward_days: 60,
    title: "Plata",
    description: "2 meses gratis" 
  }
]
```

## 🔧 **Cómo Cambiar las Recompensas**

### **Ejemplo 1: Cambiar a 5 referidos = 45 días**

```javascript
// En /src/lib/referralRewardsConfig.js
export const REFERRAL_REWARDS_CONFIG = {
  REFERRALS_PER_REWARD: 5,  // ← Cambiado de 3 a 5
  REWARD_DAYS: 45,          // ← Cambiado de 30 a 45
  // ... resto de configuración
}
```

### **Ejemplo 2: Cambiar mensajes de progreso**

```javascript
PROGRESS_MESSAGES: {
  0: "Invita doctores para ganar tiempo gratis",
  1: "¡Genial! Te faltan 4 referidos más",
  2: "¡Sigue así! Te faltan 3 referidos más", 
  3: "¡Progreso excelente! Te faltan 2 referidos más",
  4: "¡Casi lo logras! Solo 1 referido más",
  5: "🎉 ¡45 días gratis disponibles!",
}
```

## 📊 **Componentes que se Actualizan Automáticamente**

Al cambiar la configuración, estos componentes se actualizan automáticamente:

1. **Dashboard del Doctor** (`/admin`)
   - Notificación de recompensas disponibles
   - Barra de progreso
   - Botones de solicitud

2. **Panel de Referidos** (`/admin/referrals`)
   - Estadísticas de recompensas
   - Mensajes de progreso
   - Cálculos de elegibilidad

3. **Panel del Superadmin** (`/superadmin/referral-rewards`)
   - Lista de recompensas pendientes
   - Información de aprobación
   - Estadísticas generales

## 🚀 **Funciones Helper Disponibles**

### `getProgressMessage(confirmedReferrals)`
Devuelve el mensaje apropiado basado en el progreso actual.

### `calculateProgress(confirmedReferrals)`
Calcula el porcentaje de progreso hacia la próxima recompensa.

### `getAvailableRewards(confirmed, approved, pending)`
Calcula cuántas recompensas tiene disponibles para solicitar.

## ⚡ **Cambios en Tiempo Real**

**Para aplicar cambios:**
1. Modifica `/src/lib/referralRewardsConfig.js`
2. Guarda el archivo
3. La aplicación se actualiza automáticamente (hot reload)
4. Los cálculos se actualizan inmediatamente

## 🛡️ **Validaciones Automáticas**

El sistema incluye validaciones que se ajustan automáticamente:
- Verificación de elegibilidad para recompensas
- Cálculos de progreso dinámicos
- Mensajes contextuales
- Prevención de solicitudes duplicadas

## 📝 **Ejemplos de Configuraciones Populares**

### **Configuración Estándar (Actual)**
- 3 referidos = 30 días gratis
- Progreso visual con barra
- Notificaciones automáticas

### **Configuración Generosa**
```javascript
REFERRALS_PER_REWARD: 2,  // Cada 2 referidos
REWARD_DAYS: 45,          // 45 días gratis
```

### **Configuración Conservadora**
```javascript
REFERRALS_PER_REWARD: 5,  // Cada 5 referidos
REWARD_DAYS: 20,          // 20 días gratis
```

### **Configuración Premium**
```javascript
REFERRALS_PER_REWARD: 3,
REWARD_DAYS: 60,          // 2 meses gratis
MAX_REWARDS_PER_MONTH: 1, // Máximo 1 recompensa por mes
```

## 🔔 **Notificaciones y Feedback**

Todas las notificaciones se actualizan automáticamente:
- Alertas de éxito con días específicos
- Mensajes de progreso dinámicos
- Estadísticas en tiempo real
- Feedback contextual

## 📈 **Monitoreo y Análisis**

La configuración permite tracking fácil de:
- Efectividad de diferentes ratios de recompensa
- Engagement de doctores
- Conversión de referidos
- ROI del programa de referidos
