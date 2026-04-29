---
name: emil-design-eng
description: Filosofía Emil Kowalski aplicada al portal — microinteracciones, transiciones, polish que hace que la UI se sienta "viva" sin distraer. Úsalo cuando un componente funcional se sienta "muerto" o "como un wireframe".
---

# Emil Design Engineering — polish

## Principios

1. **La interfaz responde antes de que el dato llegue**: skeleton inmediato, no "blanco 200ms".
2. **Cada cambio de estado tiene transición**: no salts bruscos, easing suave (`ease-out`).
3. **El cursor sabe lo que va a pasar**: hover hints lo siguiente (color sutil, lift, cursor cambia).
4. **Errores no rompen, transitan**: el error aparece, no parpadea.
5. **Todo lo que se pulsa, se hunde 1-2px**: feedback táctil con `active:scale-[0.98]`.

## Patrones concretos

### Botones
```tsx
className="transition-all duration-150 active:scale-[0.98] active:translate-y-[1px] hover:bg-muted/80"
```

### Cards interactivas
```tsx
className="transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
```

### Loading que no parece carga
- Skeleton shape exacto del componente final (mismas dimensiones).
- Pulse sutil: `animate-pulse opacity-60` (no demasiado).
- Cuando el dato llega, **fade + scale**: `animate-in fade-in zoom-in-95 duration-200`.

### Estados vacíos con personalidad

En vez de "No hay datos", usa frases con contexto:
- "Aún no hay pedidos hoy. Vuelve cuando MainOPS reciba el primero."
- "No has añadido umbrales todavía. Crea uno para activar el semáforo."

Y un CTA visible si aplica.

### Toasts (sonner)

- Posición: `top-right` o `bottom-right`, no centro (interrumpe).
- Duración: 4s en éxito, 6s en error (necesita más tiempo de lectura).
- Icono semántico: ✓ éxito, ⚠ warn, ✕ error.

### Transiciones de página

Layout estable: el sidebar y header **nunca** parpadean al navegar entre pestañas. Solo el `main` cambia.

### Datos numéricos que cambian

Cuando un KPI se refresca:
- Si baja: animación rápida hacia el nuevo valor.
- Si sube y supera meta: micro-celebration (color verde flash 400ms).
- Sin animar cifras grandes constantemente (cansa).

## Lo que NO es polish

- Animaciones de entrada cada vez que cargas la página (cansa).
- Hover effects en elementos no clickables (engaña).
- Spinners cuando puedes mostrar el shape final.
- Sonidos.

## Cómo evaluar el polish

Pregunta: ¿se nota la diferencia respecto a un wireframe estático? Si sí, ¿en qué? Si la respuesta es "movimiento por movimiento", recorta.
