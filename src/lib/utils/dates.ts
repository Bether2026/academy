import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

/** Formatea una fecha UTC en la zona horaria del usuario, en español. */
export function fmtInTz(dateIso: string, tz: string, pattern = "EEEE d 'de' MMMM, HH:mm") {
  try {
    return formatInTimeZone(new Date(dateIso), tz, pattern, { locale: es });
  } catch {
    return dateIso;
  }
}
