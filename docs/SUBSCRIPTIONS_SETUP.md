# Sistema de Suscripciones con MercadoPago

Este documento explica cómo configurar y usar el sistema de suscripciones integrado con MercadoPago.

## Configuración Inicial

### 1. Obtener Credenciales de MercadoPago

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel)
2. Crea una aplicación
3. Obtén las credenciales de sandbox (desarrollo):
   - Access Token
   - Public Key

### 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```bash
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Webhooks

1. En el panel de MercadoPago, configura la URL del webhook:
   - URL: `https://tu-dominio.com/api/mercadopago/webhook`
   - Eventos: `payment`

2. Para desarrollo local, usa ngrok o similar para exponer tu localhost.

## Estructura del Sistema

### Componentes Principales

1. **Gestión de Planes (SuperAdmin)**
   - `/superadmin/subscriptions`: Crear y gestionar planes
   - Configurar precios, características, duración

2. **Suscripción de Doctores**
   - `/admin/subscription`: Página para suscribirse
   - Integración con MercadoPago Checkout

3. **Restricciones de Acceso**
   - Menú limitado para usuarios sin suscripción
   - Componentes protegidos por suscripción

### Servicios

1. **subscriptionsService.js**: Manejo de suscripciones y planes
2. **mercadopagoService.js**: Integración con MercadoPago
3. **APIs**: Crear preferencias, webhook, estado de pagos

## Flujo de Suscripción

1. **Usuario selecciona plan** → Página de suscripciones
2. **Crear preferencia** → API `/api/mercadopago/create-preference`
3. **Redirigir a MercadoPago** → Checkout de MercadoPago
4. **Procesar pago** → Webhook `/api/mercadopago/webhook`
5. **Activar suscripción** → Actualizar estado en Firebase
6. **Redirigir usuario** → Página de éxito/fallo

## Estados de Suscripción

- **pending**: Pago en proceso
- **active**: Suscripción activa
- **rejected**: Pago rechazado
- **expired**: Suscripción vencida
- **cancelled**: Suscripción cancelada

## Características por Nivel

### Básico (Gratis)
- Perfil básico
- Funcionalidades limitadas
- Solo página de perfil y suscripción

### Profesional/Premium (Pago)
- Acceso completo al dashboard
- Gestión de pacientes
- Agenda y citas
- Video consultas
- Reportes y estadísticas

## Administración

### SuperAdmin puede:
- Crear/editar/eliminar planes
- Ver estadísticas de suscripciones
- Gestionar precios y características
- Monitorear ingresos

### Dashboard incluye:
- Suscripciones activas
- Ingresos mensuales
- Tasa de conversión
- Historial de pagos

## Personalización

### Agregar nuevas restricciones:
1. Usar `SubscriptionProtectedRoute` component
2. Verificar `isSubscriptionActive()` en el código
3. Mostrar `SubscriptionRestriction` para usuarios sin suscripción

### Modificar planes:
1. Acceder como SuperAdmin
2. Ir a `/superadmin/subscriptions`
3. Crear/editar planes según necesidades

## Seguridad

- Webhooks verifican origen de MercadoPago
- Access tokens no se exponen al frontend
- Validación de estado de suscripción en cada request

## Testing

### Modo Sandbox (Desarrollo)
- Usar credenciales de sandbox
- Tarjetas de prueba de MercadoPago
- Webhooks con ngrok para localhost

### Tarjetas de Prueba
```
Visa: 4509 9535 6623 3704
Mastercard: 5031 7557 3453 0604
American Express: 3711 803032 57522
```

## Producción

1. Cambiar a credenciales de producción
2. Configurar dominio real en webhooks
3. Verificar SSL/HTTPS
4. Monitorear logs de pagos

## Troubleshooting

### Problemas Comunes

1. **Webhook no se ejecuta**
   - Verificar URL del webhook
   - Revisar logs del servidor
   - Confirmar que responde 200

2. **Pago no se activa**
   - Verificar external_reference
   - Revisar estado en MercadoPago
   - Verificar logs del webhook

3. **Suscripción no se refleja**
   - Verificar actualización en Firebase
   - Revisar caché del frontend
   - Confirmar userId correcto

## Soporte

Para más información consulta:
- [Documentación de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [SDK de MercadoPago para Node.js](https://github.com/mercadopago/sdk-nodejs)
