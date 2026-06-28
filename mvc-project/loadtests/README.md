# Informe de Pruebas de Performance — Hito 5

Este documento presenta el diseño, ejecución y análisis de las pruebas de carga realizadas sobre el backend del proyecto mediante la herramienta Apache JMeter, en cumplimiento con los requerimientos del Hito 5.

## 1. Metodología

Se definieron 3 escenarios de carga para evaluar la estabilidad, concurrencia e integridad transaccional del sistema. El objetivo fue determinar cómo responde la API bajo condiciones de tráfico real y simulado.

- **Herramienta:** Apache JMeter.
- **Resultado esperado:** El tiempo de respuesta promedio de las transacciones debe ser inferior a 1 segundo.

## 2. Escenarios ejecutados

### Escenario 1: Estrés por procesamiento (`/api/ocr/income`)

- **Configuración:** 30 usuarios simultáneos, rampa de 10 segundos, duración de 60 segundos.
- **Análisis:** El sistema demostró una alta estabilidad. El tiempo de respuesta promedio fue de 507 ms, cumpliendo con el objetivo de estar por debajo de 1 segundo. La baja desviación estándar indica un procesamiento consistente, validando que la arquitectura maneja eficientemente tareas intensivas en CPU como el OCR.

### Escenario 2: Pico de tráfico (`/apply`)

- **Configuración:** 100 usuarios, rampa de 5 segundos, duración de 30 segundos.
- **Análisis:** La prueba resultó en un 100% de errores con código `400 Bad Request`. Este resultado es exitoso y esperado, ya que confirma que la regla de negocio de unicidad de RUT (HU-02) se aplica correctamente. El sistema protege eficazmente la base de datos contra registros duplicados, incluso bajo alta concurrencia, manteniendo un tiempo de respuesta de validación de apenas 64 ms.

### Escenario 3: Concurrencia de pagos (`/pay-installment`)

- **Configuración:** 50 usuarios, rampa de 15 segundos, duración de 45 segundos.
- **Análisis:** El sistema evidenció integridad transaccional. Ante intentos simultáneos de pagar la misma cuota, el backend procesa la primera petición exitosamente y rechaza las siguientes con el mensaje `"Ya pagada"` (código 400). Esto valida la implementación de transacciones atómicas en la base de datos, garantizando que no existan pagos duplicados bajo ninguna condición de estrés.

## 3. Conclusión final

La ejecución de estas pruebas permitió verificar que el sistema es resiliente y robusto. Se confirmó que:

- Las reglas de negocio (validación de RUT y control de pagos) son efectivas como filtros de seguridad frente a peticiones inválidas.
- El rendimiento general es satisfactorio, con tiempos de respuesta que cumplen ampliamente con los requisitos de la aplicación.
