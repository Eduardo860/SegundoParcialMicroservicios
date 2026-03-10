# 🎨 Frontend Panel Microservicios

Panel web para probar y monitorear los microservicios con interfaz verde y clara.

## 🚀 Uso Rápido

```bash
cd frontend
npm install
npm start
```

Luego abre: **http://localhost:3000**

## 📌 Requisitos

- Los microservicios deben estar corriendo
- Docker con los servicios levantados

```bash
# Desde raíz del proyecto:
docker-compose up -d
docker-compose -f docker/mongodb/docker-compose.yml up -d
docker-compose -f docker/localstack/docker-compose.yml up -d
```

## ✨ Características

✅ Interfaz limpia con colores verdes
✅ Test de API Gateway
✅ Visualización de logs en tiempo real
✅ Status de servicios
✅ Responsive design

## 🔗 Endpoints Disponibles

- GET `/` - Panel frontend
- GET `/api/logs/:service` - Logs de un servicio

## 📁 Archivos

- `index.html` - Interfaz
- `styles.css` - Estilos (verde y claro)
- `app.js` - Javascript del frontend
- `server.js` - Servidor Node
- `package.json` - Dependencias

## 🛠️ Desarrollo

### Instalar dependencias
```bash
pm install
```

### Ejecutar en modo dev
```bash
npm run dev  # requiere nodemon
```

## 🎨 Colores Utilizados

- Verde primario: `#10b981`
- Verde claro: `#f0fdf4`
- Verde oscuro: `#047857`
