# ✅ Checklist de Despliegue en Vercel

## 📋 Pre-Despliegue

### 1. Configuración Local
- [ ] Código actualizado y probado localmente
- [ ] Todas las dependencias instaladas (`npm install`)
- [ ] Build de producción funciona (`npm run build:prod`)
- [ ] API keys de desarrollo NO están en el código

### 2. Archivos de Configuración
- [x] `src/environments/environment.prod.ts` - Configurado para usar variables de entorno
- [x] `vercel.json` - Configuración de rutas SPA y headers de seguridad
- [x] `package.json` - Script `vercel-build` agregado
- [x] `angular.json` - Configuración de producción con fileReplacements
- [x] `.gitignore` - Actualizado para permitir archivos de environment necesarios

### 3. Pruebas Pre-Despliegue
- [ ] Ejecutar script de test: `./scripts/test-build.sh`
- [ ] Verificar que no hay errores en el build
- [ ] Probar localmente: `npx http-server dist/uffizi-shop-temp/browser -p 8080`
- [ ] Verificar que todas las rutas funcionan

## 🚀 Despliegue

### 1. Repositorio en GitHub
- [ ] Código committeado y pusheado a GitHub
- [ ] Rama `main` actualizada
- [ ] Sin API keys en el código

### 2. Configuración en Vercel
- [ ] Cuenta creada en [vercel.com](https://vercel.com)
- [ ] Repositorio importado
- [ ] Framework detectado como Angular
- [ ] Configuración automática verificada:
  - Build Command: `npm run vercel-build`
  - Output Directory: `dist/uffizi-shop-temp/browser`
  - Install Command: `npm install`

### 3. Variables de Entorno
- [ ] `OPENAI_API_KEY` - API key de OpenAI
- [ ] `SUPABASE_URL` - URL de tu proyecto Supabase
- [ ] `SUPABASE_ANON_KEY` - Clave anónima de Supabase

### 4. Primer Despliegue
- [ ] Hacer clic en "Deploy"
- [ ] Esperar que termine el build
- [ ] Verificar que no hay errores

## 🔧 Post-Despliegue

### 1. Pruebas de Funcionamiento
- [ ] Sitio web carga correctamente
- [ ] Todas las rutas funcionan
- [ ] Autenticación con Supabase funciona
- [ ] Features de AI (OpenAI) funcionan
- [ ] Carrito y checkout funcionan
- [ ] Cupones de descuento funcionan

### 2. Configuración Adicional
- [ ] Dominio personalizado (opcional)
- [ ] Analytics habilitado
- [ ] Monitoring configurado

### 3. Rendimiento
- [ ] Verificar speed tests
- [ ] Revisar bundle size
- [ ] Optimizar si es necesario

## 🐛 Troubleshooting

### Build Errors:
1. Revisar logs en Vercel dashboard
2. Verificar que build funciona localmente
3. Verificar versiones de Node.js

### Runtime Errors:
1. Verificar variables de entorno
2. Revisar consola del navegador
3. Verificar conexión con Supabase

### Performance Issues:
1. Analizar bundle size
2. Optimizar imágenes
3. Implementar lazy loading

## 📝 Notas Importantes

- **Variables de entorno**: Nunca commits API keys al repositorio
- **HTTPS**: Vercel habilita HTTPS automáticamente
- **Caching**: Assets estáticos se cachean automáticamente
- **Rollback**: Puedes volver a versiones anteriores fácilmente

## 🎉 ¡Listo para Desplegar!

Una vez completado este checklist, tu aplicación estará lista para ser desplegada en Vercel con:

✅ **Seguridad**: API keys protegidas
✅ **Performance**: Optimizada para producción
✅ **Reliability**: Configuración robusta
✅ **Scalability**: Auto-scaling incluido

¡Tu museo de arte contemporáneo estará disponible para todo el mundo! 🎨 