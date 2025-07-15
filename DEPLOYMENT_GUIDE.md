# 🚀 Guía de Despliegue en Vercel

## 📋 Prerequisitos

1. **Cuenta en Vercel**: [Registrarse gratis](https://vercel.com/signup)
2. **Repositorio en GitHub**: Tu código debe estar en GitHub
3. **Variables de entorno**: Necesitarás las API keys

## 🔧 Variables de Entorno Necesarias

En el dashboard de Vercel, necesitarás configurar estas variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

## 🎯 Paso a Paso para Desplegar

### 1. **Preparar el Repositorio**

```bash
# Asegúrate de que todos los cambios están committed
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

### 2. **Conectar con Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Conecta tu cuenta de GitHub
4. Busca tu repositorio `museo-arte-contemporaneo-shop`
5. Haz clic en "Import"

### 3. **Configurar el Proyecto**

Vercel debería detectar automáticamente que es Angular, pero verifica:

- **Framework Preset**: Angular
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist/uffizi-shop-temp`
- **Install Command**: `npm install`

### 4. **Configurar Variables de Entorno**

En el dashboard de Vercel:

1. Ve a "Settings" → "Environment Variables"
2. Agrega cada variable:
   - `OPENAI_API_KEY` → tu API key de OpenAI
   - `SUPABASE_URL` → URL de tu proyecto Supabase
   - `SUPABASE_ANON_KEY` → Clave anónima de Supabase

### 5. **Desplegar**

1. Haz clic en "Deploy"
2. Espera a que termine el build (~2-3 minutos)
3. ¡Tu aplicación estará disponible!

## 🔄 Despliegues Automáticos

Vercel configurará automáticamente:
- **Despliegue en producción**: Cada push a `main`
- **Preview deployments**: Cada pull request
- **Rollback**: Volver a versiones anteriores

## 📊 Monitoreo

En el dashboard de Vercel puedes ver:
- **Analytics**: Tráfico y rendimiento
- **Functions**: Logs de ejecución
- **Domains**: Configurar dominio personalizado

## 🔒 Seguridad

✅ **HTTPS automático**: Vercel incluye SSL gratis
✅ **Headers de seguridad**: Configurados en `vercel.json`
✅ **Variables de entorno**: Nunca expuestas al cliente

## 🌐 Dominio Personalizado

Para usar tu propio dominio:

1. Ve a "Settings" → "Domains"
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

## 🐛 Troubleshooting

### Build Failures:
- Revisa los logs en el dashboard
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el build funcione localmente

### Runtime Errors:
- Verifica las variables de entorno
- Revisa la consola del navegador
- Checa los logs de Vercel

### Routing Issues:
- El archivo `vercel.json` maneja las rutas SPA
- Todas las rutas redirigen a `index.html`

## 📈 Optimizaciones

### Performance:
- **Caching**: Assets estáticos se cachean automáticamente
- **Compression**: Gzip habilitado por defecto
- **Edge Network**: CDN global incluido

### Bundle Size:
```bash
# Analizar bundle size
npm run build:prod -- --stats-json
npx webpack-bundle-analyzer dist/uffizi-shop-temp/stats.json
```

## 🎉 ¡Listo!

Tu aplicación de museo de arte contemporáneo ahora está disponible en:
- **URL de producción**: `https://your-project-name.vercel.app`
- **Dominio personalizado**: Tu dominio configurado

## 🔄 Comandos Útiles

```bash
# Build local para testing
npm run build:prod

# Servir build local
npx http-server dist/uffizi-shop-temp

# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy desde CLI
vercel --prod
```

## 📞 Soporte

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Angular on Vercel**: [vercel.com/guides/deploying-angular](https://vercel.com/guides/deploying-angular)
- **Vercel Discord**: Comunidad activa para ayuda

¡Tu aplicación está lista para conquistar el mundo! 🎨✨ 