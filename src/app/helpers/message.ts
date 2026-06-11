import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageHelper {
  stored()       { return 'Registro almacenado con éxito.'; }
  updated()      { return 'Registro actualizado con éxito.'; }
  deleted()      { return 'Registro eliminado con éxito.'; }
  duplicated()   { return 'Registro duplicado'; }
  notFound(ent: string)  { return `${ent} no encontrado`; }
  loadError(ent: string) { return `Error al cargar ${ent}`; }
  saveError() { return 'Error al guardar'; }
  deleteError(ent: string) { return `Error al eliminar ${ent}`; }
  serverError() { return 'Error del servidor'; }
  genericError() { return 'Hubo un error durante la operación.'; }
  required()     { return 'Campo requerido'; }
  invalidEmail() { return 'Correo electrónico inválido'; }
  onlyNumbers()  { return 'Solo se permiten números'; }
  invalidPhone() { return 'Debe ser un número venezolano válido (ej: 04121234567)'; }
  noPrivileges() { return 'Debe asignar al menos un privilegio al rol'; }
  approveError() { return 'Error al aprobar'; }
  rejectError()  { return 'Error al rechazar'; }
  fingerprintError() { return 'Error al capturar huella'; }
  photoSizeError()   { return 'La foto no debe superar los 2MB'; }
  photoReadError()   { return 'No se pudo leer la foto seleccionada.'; }
  loginError()       { return 'Correo o contraseña incorrectos'; }
}
