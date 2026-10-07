# Easy Charge - Calculadora de Energía MVP

**App web profesional para calcular automáticamente qué generador SECCO necesita cada cliente.**

---

## ⚡ FLUJO EN VISITA TÉCNICA

1. ✅ Ingresas equipos y consumo (W) medido con multímetro
2. ✅ Sistema suma automáticamente
3. ✅ Obtiene generador recomendado automático
4. ✅ Genera PDF de cotización al instante
5. ✅ Cliente firma en tablet

---

## 🚀 DEPLOY EN VERCEL (5 minutos)

### PASO 1: Push a GitHub
Desde tu máquina (donde tienes Git instalado):

```bash
cd /ruta/de/easy-charge-calculator

# Hacer push a GitHub
git push origin main
```

### PASO 2: Deploy en Vercel
1. Ir a: https://vercel.com
2. Haz login (si no tienes cuenta, crea una gratis)
3. Clickea **"Add New..."** → **"Project"**
4. Busca y selecciona `easy-charge-calculator`
5. Clickea **"Deploy"**
6. ✅ En 1-2 minutos tienes URL en vivo (ej: `https://easy-charge-calculator-ignacop98.vercel.app`)

---

## 📝 ACTUALIZAR DATOS SECCO

Cuando tu primo te pase los datos reales:

1. Abre: `app/api/recommend/route.ts`
2. Busca el array `SECCO_PRODUCTS`
3. Actualiza cada producto con datos reales:

```typescript
{
  id: 1,
  name: 'Nombre exacto del producto',
  power: '3000W',
  battery: '3.6kWh',
  price: '$35,000',      // ← Precio real
  autonomy: '1-2 horas',
  minPower: 0,
  maxPower: 3000,
  specs: 'Especificaciones técnicas aquí'
}
```

4. Hace un nuevo commit:
```bash
git add app/api/recommend/route.ts
git commit -m "Update SECCO products with real data"
git push origin main
```

5. Vercel auto-deploya los cambios (tarda 1 minuto)

---

## 🛠️ STACK TÉCNICO

- **Next.js 14** (React framework full-stack)
- **TypeScript** (type safety)
- **Tailwind CSS** (diseño profesional)
- **jsPDF + html2canvas** (generador de PDFs)
- **Axios** (HTTP requests)
- **Vercel** (hosting gratis)

---

## 📦 ESTRUCTURA DEL PROYECTO

```
easy-charge-calculator/
├── app/
│   ├── page.tsx                    # Página principal (calculador)
│   ├── layout.tsx                  # Layout de la app
│   ├── globals.css                 # Estilos globales
│   └── api/
│       └── recommend/
│           └── route.ts            # API de recomendaciones
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

## 📱 PROBAR LOCALMENTE

```bash
npm run dev
```

Luego abre: http://localhost:3000

---

## ✅ DEMO PARA EL DUEÑO

Mostrar en vivo:
1. Agregar equipos (TV: 142W, Heladera: 215W, Aire: 1480W)
2. Ver suma automática (1837W)
3. Clickear "Obtener Recomendación"
4. Ver generador recomendado automático (4kW)
5. Generar PDF con cotización
6. **Explicar diferencial**: Con generador solar, cero contaminación ✅

---

## 🎯 PRÓXIMOS PASOS (Fase 2)

- [ ] Portal de clientes (historial de cotizaciones)
- [ ] Panel admin (ver todos los relevamientos)
- [ ] Optimizador de consumo (cuánto ahorras con paneles)
- [ ] Chat de soporte
- [ ] Base de datos PostgreSQL

---

**¡Listo para demostrar al dueño!** 🚀
