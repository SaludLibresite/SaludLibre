# Configuración de Video Consultas con Jitsi Meet

Esta guía te ayudará a configurar las videoconsultas en tu aplicación Doctores AR usando Jitsi Meet.

## Estado Actual

✅ **Implementado:**
- Interfaz completa de videoconsultas
- Creación de salas con búsqueda de pacientes
- Gestión de consultas programadas
- Integración con Firebase para persistencia
- Sistema de permisos y acceso seguro
- Configuración personalizada por rol (doctor/paciente)

⚠️ **Usando servidor público:** Actualmente usando `meet.jit.si` (servidor público de Jitsi)

## Próximos Pasos: Servidor Propio

### ¿Por qué necesitas un servidor propio?

1. **Privacidad**: Control total sobre los datos médicos
2. **Personalización**: Branding y configuraciones específicas
3. **Rendimiento**: Mejor calidad y menos latencia
4. **Cumplimiento**: Requisitos médicos y legales (HIPAA, etc.)

### Opciones de Implementación

#### Opción 1: Servidor Propio (Recomendado para Producción)

**Requisitos mínimos del servidor:**
- Ubuntu 20.04 LTS o superior
- 4 CPU cores, 8GB RAM, 100GB SSD
- IP pública estática
- Dominio propio (ej: `videoconsultas.doctores-ar.com`)

**Pasos de instalación:**

1. **Configurar el servidor**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y curl wget gnupg2 software-properties-common

# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4443/tcp
sudo ufw allow 10000/tcp
sudo ufw enable
```

2. **Instalar Jitsi Meet**
```bash
# Agregar repositorio
curl -sS https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -
echo "deb https://download.jitsi.org stable/" | sudo tee /etc/apt/sources.list.d/jitsi-stable.list

# Instalar
sudo apt update
sudo apt install -y jitsi-meet

# Durante la instalación, usar tu dominio: videoconsultas.doctores-ar.com
# Elegir "Generate a new self-signed certificate"
```

3. **Configurar SSL con Let's Encrypt**
```bash
sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

4. **Configurar autenticación (opcional)**
```bash
# Para salas protegidas
sudo prosodyctl register doctor videoconsultas.doctores-ar.com password123
```

#### Opción 2: Jitsi as a Service (JaaS) - 8x8

**Ventajas:**
- Administrado completamente
- Escalabilidad automática
- Soporte profesional

**Configuración:**
1. Crear cuenta en [JaaS Console](https://jaas.8x8.vc/)
2. Obtener App ID y configurar JWT
3. Actualizar configuración en la app

### Configuración en la Aplicación

Una vez que tengas tu servidor Jitsi:

1. **Actualizar dominio en `jitsiConfig.js`:**
```javascript
export const JITSI_CONFIG = {
  // Cambiar de 'meet.jit.si' a tu dominio
  domain: 'videoconsultas.doctores-ar.com',
  // ... resto de configuración
};
```

2. **Configurar autenticación JWT (para JaaS):**
```javascript
// En tu backend, generar JWT para cada sala
const jwt = generateJWT({
  appId: 'tu-app-id',
  kid: 'tu-key-id',
  room: roomName,
  user: {
    id: userId,
    name: userName,
    email: userEmail,
    role: userRole // 'moderator' para doctores
  }
});
```

### Configuraciones Adicionales

#### Personalización de Interfaz

Edita `/etc/jitsi/meet/videoconsultas.doctores-ar.com-config.js`:

```javascript
var config = {
    // Tu configuración personalizada
    brandingConfig: {
        welcomePageTitle: 'Doctores AR - Video Consultas',
        logoImageUrl: 'https://tu-dominio.com/logo.png'
    },
    
    // Desactivar características innecesarias
    disableDeepLinking: true,
    disableInviteFunctions: true,
    
    // Configuraciones médicas
    startWithAudioMuted: true,
    startWithVideoMuted: false,
    enableWelcomePage: false,
    
    // Grabación (requiere Jibri)
    fileRecordingsEnabled: true,
    dropbox: {
        appKey: 'tu-dropbox-key'
    }
};
```

#### Configuración de Grabación (Opcional)

Para habilitar grabación automática, instalar Jibri:

```bash
# Instalar Jibri para grabaciones
sudo apt install -y jibri
sudo systemctl enable jibri
sudo systemctl start jibri
```

### Seguridad y Cumplimiento

1. **Configurar HTTPS obligatorio**
2. **Implementar autenticación JWT**
3. **Configurar logs de auditoría**
4. **Backup regular de configuraciones**
5. **Monitoreo de servidor**

### Costos Estimados

| Opción | Costo Mensual | Pros | Contras |
|--------|---------------|------|---------|
| meet.jit.si | Gratis | Fácil, sin setup | Sin control, limitado |
| Servidor propio | $50-200 | Control total | Requiere administración |
| JaaS | $0.15/min | Administrado | Costo por uso |

### Lista de Tareas

#### Inmediato (Usando meet.jit.si)
- [x] Implementar interfaz básica
- [x] Crear/unirse a salas
- [x] Gestión de pacientes
- [x] Permisos básicos

#### Corto Plazo (1-2 semanas)
- [ ] Configurar servidor Jitsi propio
- [ ] Implementar autenticación JWT
- [ ] Personalizar branding
- [ ] Configurar SSL/HTTPS

#### Mediano Plazo (1 mes)
- [ ] Sistema de grabación
- [ ] Notificaciones automáticas
- [ ] Integración con calendario
- [ ] Dashboard de analytics

#### Largo Plazo (2-3 meses)
- [ ] App móvil nativa
- [ ] Integración con historiales médicos
- [ ] Sistema de facturación
- [ ] Cumplimiento HIPAA/normativas locales

### Contacto y Soporte

Para implementación del servidor Jitsi:
- Documentación oficial: https://jitsi.github.io/handbook/
- Community: https://community.jitsi.org/
- Docker: https://github.com/jitsi/docker-jitsi-meet

### Comandos Útiles

```bash
# Verificar estado de servicios
sudo systemctl status prosody
sudo systemctl status jicofo
sudo systemctl status jitsi-videobridge2

# Ver logs
sudo journalctl -f -u jitsi-videobridge2
sudo journalctl -f -u jicofo

# Reiniciar servicios
sudo systemctl restart prosody jicofo jitsi-videobridge2
```

---

**Nota:** La implementación actual está lista para producción con meet.jit.si. El cambio a servidor propio es una mejora que puede implementarse gradualmente sin afectar la funcionalidad existente.
