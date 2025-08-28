# Configuración de MercadoPago con Checkout Pro

## Qué es Checkout Pro

Checkout Pro es la solución más simple de MercadoPago. No requiere instalar SDKs complicados, solo usar la API REST y cargar un script ligero en el frontend.

## Configuración Paso a Paso

### 1. Crear cuenta en MercadoPago

1. Ve a [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Crea tu cuenta de desarrollador
3. Crea una nueva aplicación

### 2. Obtener las credenciales

En tu aplicación de MercadoPago:
- **Credenciales de prueba** (para testing):
  - `TEST-...` (Access Token)
  - `TEST-...` (Public Key)
- **Credenciales de producción** (para usar en vivo):
  - `APP_USR-...` (Access Token)
  - `APP_USR-...` (Public Key)

### 3. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y completa:

```bash
# Para testing
MERCADOPAGO_ACCESS_TOKEN=TEST-your-test-access-token-here
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-test-public-key-here

# Para producción
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token-here
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key-here

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar webhook

En MercadoPago, configura el webhook:
- URL: `https://tu-dominio.com/api/mercadopago/webhook`
- Eventos: `payment`

### 5. Instalar dependencias

```bash
pnpm install
# Nota: Ya no necesitamos el SDK de MercadoPago
```

### 6. Probar el sistema

1. Ejecuta la aplicación: `pnpm dev`
2. Ve a SuperAdmin → Suscripciones
3. Crea un plan de prueba
4. Prueba el flujo de pago

## Flujo de Funcionamiento

### 1. Usuario selecciona plan
- En el admin layout, aparece el botón "Actualizar Plan"
- Se muestran los planes disponibles

### 2. Crear preferencia de pago
- Se llama a `/api/mercadopago/create-preference`
- Se crea la preferencia usando la API REST
- Se devuelve el `init_point` para redirigir

### 3. Proceso de pago
- Usuario es redirigido a MercadoPago
- Completa el pago
- MercadoPago redirige según el resultado

### 4. Webhook procesa el resultado
- MercadoPago envía notificación a `/api/mercadopago/webhook`
- Se actualiza el estado de la suscripción
- Se activan/desactivan las funcionalidades

## URLs de respuesta

- **Éxito**: `/subscription/success`
- **Error**: `/subscription/failure`
- **Pendiente**: `/subscription/pending`

## Testeo

Para probar pagos usa las tarjetas de prueba de MercadoPago:
- **Aprobada**: 4509 9535 6623 3704
- **Rechazada**: 4013 5406 8274 6260

## Ventajas de Checkout Pro

1. **Simple**: Solo API REST, sin SDKs complejos
2. **Ligero**: Script de 2KB vs SDK de 200KB+
3. **Mantenible**: Menos dependencias
4. **Seguro**: PCI compliance automático
5. **Responsivo**: Funciona en móvil perfectamente

## Archivos modificados

- `/src/lib/mercadopagoService.js` - Servicio simplificado
- `/src/pages/api/mercadopago/create-preference.js` - Sin SDK
- `/src/pages/api/mercadopago/webhook.js` - API REST
- `/src/pages/api/mercadopago/payment-status/[paymentId].js` - Sin SDK
- `package.json` - Removida dependencia `mercadopago`

¡El sistema está listo para usar! 🚀
