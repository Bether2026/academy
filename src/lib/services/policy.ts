/**
 * Reglas de negocio de clases (visibles al alumno antes de reservar).
 * Cambiar acá = cambia en toda la app y en los textos que las muestran.
 */
export const CLASS_POLICY = {
  /** Horas mínimas de anticipación para reservar una clase. */
  minBookingLeadHours: 12,
  /** Horas antes de la clase hasta las cuales se puede cancelar sin costo. */
  freeCancellationHours: 24,
  /** Días hacia adelante que se ofrecen turnos. */
  bookingWindowDays: 14,
  /** Duración estándar de la clase en minutos. */
  classDurationMinutes: 50,
} as const;
