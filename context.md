# Contexto del Proyecto: Time Bank
# [cite_start]Asignatura: Desarrollo de Sistemas Web (2025/2026) [cite: 2, 3]

## 1. Descripción y Naturaleza del Proyecto
[cite_start]El proyecto consiste en desarrollar una aplicación web llamada "Time Bank", una plataforma *peer-to-peer* (P2P) para el intercambio de servicios entre particulares[cite: 5]. [cite_start]El sistema se basa en el concepto de los bancos de tiempo: los usuarios ofrecen servicios a otros y, a cambio, reciben una moneda virtual llamada "créditos de tiempo"[cite: 6]. [cite_start]Estos créditos se utilizan posteriormente para solicitar servicios a otros miembros de la comunidad[cite: 6]. [cite_start]Además de ganar créditos trabajando, los usuarios pueden recargar su saldo a través de un backend que simula una pasarela de pagos[cite: 7].

## 2. Arquitectura del Sistema
[cite_start]El sistema debe diseñarse siguiendo una arquitectura de dos backends independientes que se comunican a través de APIs bien definidas[cite: 11, 16]:

* [cite_start]**Backend de Pasarela de Pagos (Simple Backend):** Un backend simplificado cuya única responsabilidad es simular una pasarela de pago, validando la información y autorizando la compra de créditos de tiempo[cite: 12, 13].
* **Backend Principal (Time Bank Application):** El núcleo del sistema. [cite_start]Se encarga de la gestión de usuarios, catálogo de servicios, control de créditos de tiempo, solicitudes de servicios y transacciones[cite: 14, 15].

## 3. Requisitos Tecnológicos
* [cite_start]**Backend:** Python FastAPI. Separación entre Modelos, Servicios, Controladores Y Repositorios como en Java SpringBoot
* [cite_start]**Frontend:** Framework  React. Debe ser una SPA (Single Page Application) o similar, con un diseño completamente responsivo para garantizar el acceso desde cualquier navegador web[cite: 21].
* [cite_start]**Persistencia:** MySql
* [cite_start]**Comunicaciones:** Diseño estricto de API RESTful[cite: 20].
* [cite_start]**Seguridad y Sesiones:** La autenticación y la gestión de sesiones deben implementarse obligatoriamente mediante tokens (ej. JWT)[cite: 20].

## 4. Estándares de Calidad y Buenas Prácticas (CRÍTICO)
[cite_start]Para resolver este ejercicio es obligatorio aplicar buenas prácticas de ingeniería web y desarrollo de software[cite: 8, 9]. Todo el código generado debe adherirse a los siguientes principios:
* **Principios SOLID:** Código orientado a objetos/funciones con responsabilidades únicas, abierto a extensión pero cerrado a modificación, e inyección de dependencias (especialmente útil en FastAPI).
* **Principio DRY (Don't Repeat Yourself):** Evitar la duplicación de lógica, extrayendo utilidades y servicios compartidos.
* [cite_start]**TDD (Test Driven Development):** Es altamente aconsejable escribir las pruebas automatizadas antes que la lógica de negocio[cite: 9].
* **Código Limpio y Comentado:** Nomenclatura descriptiva para variables y funciones. Uso de *docstrings* y comentarios que expliquen el "por qué" de decisiones complejas, no el "qué".
* [cite_start]**Control de Versiones:** Uso obligatorio de Git y GitHub para el alojamiento del código[cite: 9].

## 5. Conceptos Clave del Dominio
* [cite_start]**Usuarios:** Participantes registrados en la plataforma[cite: 23].
* [cite_start]**Servicios:** Actividades ofrecidas (ej. tutorías, reparaciones, práctica de idiomas)[cite: 24].
* [cite_start]**Créditos de Tiempo:** Moneda virtual para pagar los servicios[cite: 25].
* [cite_start]**Transacciones:** Registros inmutables de pagos de servicios y transferencias de créditos[cite: 26].
* [cite_start]**Solicitudes (Requests):** Peticiones formales realizadas por los usuarios para recibir un servicio[cite: 27].

## 6. Hoja de Ruta y Sprints

### [cite_start]Sprint 1: Fundamentos, Gestión de Usuarios y Seguridad (Fecha límite: 26 de marzo de 2026) [cite: 34]
* [cite_start]**Objetivos:** Establecer la arquitectura base y la seguridad[cite: 36, 37].
* [cite_start]**Requisitos:** Registro de usuarios, login/logout, gestión de sesiones por token (JWT) y gestión del perfil[cite: 39, 40, 41, 42]. [cite_start]Implementar roles: Administrador (permisos globales) y Usuario (permisos estándar)[cite: 45, 46]. [cite_start]Documentación básica de la API[cite: 47].

### [cite_start]Sprint 2: Mercado de Servicios y Economía (Fecha límite: 23 de abril de 2026) [cite: 49]
* [cite_start]**Objetivos:** Funcionalidad core del banco de tiempo y moneda virtual[cite: 51, 52].
* [cite_start]**Requisitos:** CRUD de servicios, descubrimiento y filtrado[cite: 54, 55]. [cite_start]Flujo de solicitudes (pedir, aceptar, rechazar, cancelar, completar)[cite: 58]. [cite_start]Gestión de créditos (balance, pagos, transferencias e historial de transacciones)[cite: 60, 61, 63, 64].

### [cite_start]Sprint 3: Pasarela de Pagos y Funciones Avanzadas (Fecha límite: 14 de mayo de 2026) [cite: 67]
* [cite_start]**Objetivos:** Integración con proveedor real y panel de administración[cite: 69, 87].
* [cite_start]**Requisitos:** Reemplazar la pasarela simulada por Stripe o PayPal usando webhooks[cite: 76, 78]. [cite_start]Actualizar balances tras la confirmación de pago y guardar IDs externos[cite: 80, 81]. [cite_start]Sistema de valoraciones y reseñas solo para servicios completados[cite: 82, 84, 85]. [cite_start]Panel de administración (gestión de usuarios, moderación de servicios y monitorización)[cite: 88, 89, 90, 91].

## 7. Criterios de Evaluación Continua
* [cite_start]La evaluación prioriza la implementación correcta de requisitos, la seguridad, la arquitectura y la calidad del código[cite: 114, 115, 116].
* [cite_start]Al final de cada sprint, es obligatoria una reunión de revisión con el profesor para mostrar el progreso[cite: 124, 126].
* [cite_start]Para estas reuniones, se deben presentar actualizados los Modelos de Contenido, Navegación y Presentación[cite: 120, 122, 123].