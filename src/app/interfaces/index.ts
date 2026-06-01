export interface ApiResponse<T = any> {
  error: number;
  msg: string;
  results?: T;
  requires_confirmation?: boolean;
  dependencies?: { tabla: string; registros: number }[];
}

export interface EmpleadoData {
  empleadoId: string;
  nombre: string;
  apellido: string;
  telefono: string;
  identificacion: string;
  correo: string;
  id_cargo: string;
  sexo: string;
  foto: string;
  created_at: string;
  updated_at: string;
}

export interface CargoData {
  id: string;
  cargo: string;
}

export interface RoleData {
  id: string;
  role: string;
}

export interface PrivilegioData {
  id: string;
  privilegio: string;
}

export interface AsistenciaData {
  asistenciaId: string;
  id_empleado: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  status?: string;
  tipo_marcacion?: string;
  motivo_rechazo?: string;
}

export interface KioskoResponse {
  error: number;
  msg: string;
  tipo?: 'entrada' | 'salida';
  status?: string;
}

export interface InasistenciaData {
  inasistenciaId: string;
  id_empleado: string;
  fecha: string;
  justificacion: string;
}

export interface HorarioData {
  horarioId: string;
  id_empleado: string;
  dia: string;
  hora_entrada_esperada: string;
  hora_salida_esperada: string;
}

export interface FeriadoData {
  id: string;
  fecha: string;
  descripcion: string;
}

export interface LoginResponse {
  empleado: EmpleadoData;
  token: string;
}
