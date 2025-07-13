# 🧪 Guía de Pruebas del Sistema de Perfiles

## ✅ **Checklist de Verificación**

### 1. **Verificar Registro de Usuario**
- [ ] Ir a `/register`
- [ ] Registrar un nuevo usuario con nombre completo
- [ ] Verificar que se cree automáticamente en la tabla `profiles`

### 2. **Verificar Header**
- [ ] Comprobar que el nombre del usuario aparece en el header
- [ ] Verificar que los datos vienen de la tabla `profiles` (no de `auth.users`)
- [ ] Probar el dropdown del usuario

### 3. **Verificar Página de Perfil**
- [ ] Ir a `/profile`
- [ ] Verificar que cargan los datos del usuario
- [ ] Probar editar información personal
- [ ] Verificar que los cambios se guardan en la tabla `profiles`

### 4. **Verificar Direcciones de Envío**
- [ ] Agregar una nueva dirección
- [ ] Verificar que se guarda en la tabla `shipping_addresses`
- [ ] Probar editar una dirección existente
- [ ] Probar eliminar una dirección
- [ ] Verificar que solo una dirección puede ser predeterminada

### 5. **Verificar Seguridad RLS**
- [ ] Crear otro usuario
- [ ] Verificar que cada usuario solo ve sus propios datos
- [ ] Intentar acceder a datos de otro usuario (debería fallar)

## 🔍 **Consultas SQL para Verificar**

```sql
-- Verificar que se creó el perfil automáticamente
SELECT * FROM public.profiles;

-- Verificar direcciones de envío
SELECT * FROM public.shipping_addresses;

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'shipping_addresses');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'shipping_addresses');
```

## 🐛 **Problemas Comunes y Soluciones**

### **Error: "No se pueden cargar los datos del perfil"**
- Verificar que RLS esté habilitado
- Comprobar que las políticas RLS estén activas
- Verificar que el usuario esté autenticado

### **Error: "No se puede crear dirección"**
- Verificar que todos los campos requeridos estén llenos
- Comprobar que el usuario esté autenticado
- Verificar las políticas RLS para INSERT

### **El nombre no aparece en el header**
- Verificar que el perfil se haya creado correctamente
- Comprobar que el trigger esté funcionando
- Verificar que los datos se estén cargando desde `profiles`

## 🎯 **Flujo de Datos Esperado**

```
1. Usuario se registra → Trigger crea perfil en `profiles`
2. Usuario inicia sesión → Header carga datos de `profiles`
3. Usuario va a /profile → Carga datos de `profiles` y `shipping_addresses`
4. Usuario edita perfil → Actualiza tabla `profiles`
5. Usuario agrega dirección → Inserta en `shipping_addresses`
```

## 📊 **Monitoreo en Supabase Dashboard**

1. **Logs**: Ve a "Logs" para ver las consultas SQL
2. **Database**: Verifica los datos en las tablas
3. **Auth**: Monitorea los usuarios registrados
4. **API**: Revisa las llamadas a la API

---

**¿Todo funciona correctamente?** Si encuentras algún problema, revisa los logs en Supabase Dashboard y verifica que las tablas y políticas estén configuradas correctamente. 