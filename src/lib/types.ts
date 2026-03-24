// ── Auth ──
export type TipoUsuario = "comercio" | "mesero" | "cocinero" | "barman" | "cajero" | "cliente" | "repartidor";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  tipo_usuario: TipoUsuario;
  telefono?: string;
  direccion?: string;
  foto_perfil?: string;
  is_staff: boolean;
  is_active: boolean;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

// ── Menu ──
export interface Category {
  id: number;
  name: string;
  description?: string;
  order: number;
  image?: string;
  items_count?: number;
}

export interface Section {
  id: number;
  name: string;
  description?: string;
}

export interface MenuItem {
  id: number;
  category: number;
  category_name?: string;
  section?: number;
  section_name?: string;
  name: string;
  description?: string;
  price: string;
  image?: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time?: number;
  calories?: number;
  order: number;
}

export interface Ingredient {
  id: number;
  name: string;
  description?: string;
  is_allergen: boolean;
}

// ── Pedidos ──
export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente?: number;
  comercio?: number;
  mesa?: number;
  mesa_numero?: number;
  atencion?: number;
  estado: string;
  tipo_entrega: string;
  subtotal: string;
  costo_delivery: string;
  costo_empaques: string;
  impuestos: string;
  descuento: string;
  total: string;
  notas?: string;
  created_at: string;
  detalles?: PedidoDetalle[];
  promociones?: PedidoPromocion[];
  empaques?: PedidoEmpaque[];
  metodo_pago?: { metodo: string; display: string } | null;
}

export interface PedidoDetalle {
  id: number;
  menu_item: number;
  menu_item_name?: string;
  menu_item_nombre?: string;
  section_name?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  notas?: string;
  salsas_seleccionadas?: string[];
}

export interface PromocionItem {
  id?: number;
  rol: "aplica" | "adicional";
  menu_item?: number;
  menu_item_nombre?: string;
  category?: number;
  category_nombre?: string;
  cantidad: number;
  precio_filtro?: string;
}

export interface Promocion {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: "nxm" | "combo" | "adicional";
  tipo_display: string;
  is_active: boolean;
  vigente: boolean;
  precio_promocional?: string;
  precio_extra?: string;
  cantidad_requerida?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  items?: PromocionItem[];
  created_at?: string;
}

export interface PedidoPromocion {
  id: number;
  promocion: number;
  promocion_nombre: string;
  promocion_tipo: string;
  promocion_tipo_display: string;
  menu_item_seleccionado?: number;
  menu_item_seleccionado_nombre?: string;
  menu_item_seleccionado_section?: string;
  secciones_items?: string[];
  items_detalle?: { nombre: string; section_name: string | null; cantidad: number }[];
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface TipoEmpaque {
  id: number;
  nombre: string;
  precio: string;
  descripcion: string;
  is_active: boolean;
}

export interface PedidoEmpaque {
  id: number;
  tipo_empaque: number;
  tipo_empaque_nombre: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface Notificacion {
  id: number;
  tipo: string;
  tipo_display: string;
  titulo: string;
  mensaje: string;
  destinatario?: number;
  pedido?: number;
  pedido_numero?: string;
  leida: boolean;
  created_at: string;
}

export interface NotificacionesNoLeidasResponse {
  count: number;
  notificaciones: Notificacion[];
}

// ── Mesas & Atención ──
export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: string;
  ubicacion: string;
  pos_x?: number;
  pos_y?: number;
}

export interface Atencion {
  id: number;
  numero_atencion: string;
  mesa: number;
  mesa_numero?: number;
  mesero?: number;
  mesero_nombre?: string;
  numero_comensales: number;
  estado: string;
  hora_llegada: string;
  notas?: string;
}

// ── Cocina / Comandas ──
export interface ComandaCocina {
  id: number;
  atencion?: number;
  mesa_numero?: number;
  pedido?: number;
  pedido_numero?: string;
  numero_comanda?: string;
  seccion_destino?: number;
  seccion_nombre?: string;
  estado: string;
  prioridad: string;
  hora_enviada: string;
  hora_inicio_preparacion?: string;
  hora_listo?: string;
  hora_servido?: string;
  notas_cocina?: string;
  total_items?: number;
  detalles?: ComandaDetalle[];
}

export interface ComandaDetalle {
  id: number;
  comanda: number;
  menu_item: number;
  menu_item_name?: string;
  cantidad: number;
  estado: string;
  notas?: string;
}

// ── Inventario ──
export interface CategoriaInsumo {
  id: number;
  nombre: string;
  descripcion?: string;
  area: "cocina" | "barra";
  total_insumos?: number;
}

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  tipo: "peso" | "volumen" | "unidad";
  tipo_display?: string;
  factor_conversion?: string;
}

export interface InventarioItem {
  id: number;
  nombre: string;
  categoria_insumo?: number;
  categoria_nombre?: string;
  categoria_area?: string;
  unidad_medida?: number;
  unidad_abreviatura?: string;
  unidad?: string;
  stock_actual: string;
  stock_minimo: string;
  costo_unitario: string;
  perecedero: boolean;
  fecha_vencimiento?: string;
  proveedor_principal?: number;
  proveedor_nombre?: string;
  alerta_stock?: boolean;
}

export interface MovimientoInventario {
  id: number;
  insumo: number;
  insumo_nombre?: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: string;
  fecha: string;
  notas?: string;
}

// ── Limpieza ──
export interface AreaLimpieza {
  id: number;
  nombre: string;
  descripcion?: string;
  prioridad: string;
}

export interface ProtocoloLimpieza {
  id: number;
  nombre: string;
  area?: number;
  area_nombre?: string;
  frecuencia: string;
  tipo_limpieza: string;
  duracion_estimada?: number;
}

export interface ProgramaLimpieza {
  id: number;
  nombre?: string;
  turno: string;
  dia: string;
}

export interface RegistroLimpieza {
  id: number;
  programa: number;
  protocolo: number;
  estado: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  observaciones?: string;
}

// ── Alertas ──
export interface AlertaStockBajo {
  id: number;
  insumo: number;
  insumo_nombre: string;
  unidad: string;
  tipo: "stock_bajo" | "sin_stock";
  tipo_display: string;
  stock_al_momento: string;
  stock_minimo: string;
  mensaje: string;
  leida: boolean;
  resuelta: boolean;
  created_at: string;
}

export interface AlertasNoLeidasResponse {
  count: number;
  alertas: AlertaStockBajo[];
}

// ── Paginated Response ──
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Costeo de Recetas ──
export interface CosteoIngrediente {
  id?: number;
  insumo?: number | null;
  insumo_nombre?: string;
  nombre: string;
  costo_unitario: number | string;
  cantidad: number | string;
  unidad: string;
  total?: number | string;
}

export interface CostoExtra {
  id?: number;
  concepto: string;
  monto: number | string;
}

export interface CosteoRecetaList {
  id: number;
  nombre: string;
  porciones: number;
  porcentaje_utilidad: string;
  porcentaje_costo_fijo: string;
  total_ingredientes: string;
  total_extras: string;
  costo_total: string;
  precio_venta: string;
  updated_at: string;
  created_at: string;
}

export interface CosteoRecetaDetail {
  id: number;
  nombre: string;
  porciones: number;
  porcentaje_utilidad: string;
  porcentaje_costo_fijo: string;
  notas: string;
  ingredientes: CosteoIngrediente[];
  extras: CostoExtra[];
  total_ingredientes: string;
  total_extras: string;
  costo_total: string;
  costo_fijo: string;
  costo_total_con_fijo: string;
  costo_por_porcion: string;
  precio_venta: string;
  updated_at: string;
  created_at: string;
}

// ── Asistencia ──

export interface ConfiguracionLocal {
  id: number;
  nombre: string;
  latitud: string;
  longitud: string;
  radio_metros: number;
  direccion: string;
  created_at: string;
  updated_at: string;
}

export interface RegistroAsistencia {
  id: number;
  usuario: number;
  usuario_nombre: string;
  tipo_usuario: string;
  local: number | null;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  latitud_entrada: string;
  longitud_entrada: string;
  distancia_entrada: string;
  latitud_salida: string | null;
  longitud_salida: string | null;
  distancia_salida: string;
  estado: "en_turno" | "completado" | "irregular";
  notas: string;
  horas_trabajadas: number | null;
  horas_trabajadas_display: string;
  created_at: string;
  updated_at: string;
}

export interface ResumenMensual {
  mes: number;
  anio: number;
  total_horas: number;
  dias_trabajados: number;
  registros: RegistroAsistencia[];
}

export interface ResumenEmpleado {
  usuario_id: number;
  nombre: string;
  tipo_usuario: string;
  total_horas: number;
  dias_trabajados: number;
}

export interface ResumenEquipo {
  mes: number;
  anio: number;
  equipo: ResumenEmpleado[];
}

// ── Caja Diaria ──
export interface CategoriaGasto {
  id: number;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface SocioCatalog {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CategoriaInversion {
  id: number;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface GastoDiario {
  id: number;
  cierre_caja: number;
  descripcion: string;
  monto: string;
  categoria: number;
  categoria_display?: string;
  medio_pago: string;
  medio_pago_display?: string;
  insumo?: number | null;
  insumo_nombre?: string;
  unidad_medida?: string;
  cantidad_insumo?: string | null;
  costo_unitario_insumo?: string | null;
  created_at: string;
}

export interface InversionSocio {
  id: number;
  cierre_caja: number;
  socio: number;
  socio_display?: string;
  monto: string;
  descripcion: string;
  categoria: number;
  categoria_display?: string;
  created_at: string;
}

export interface CierreCaja {
  id: number;
  fecha: string;
  monto_apertura: string;
  apertura_at?: string | null;
  ajuste_transferencia?: string | null;
  total_ventas: string;
  total_gastos: string;
  resultado: string;
  observaciones: string;
  cerrado: boolean;
  cerrado_at?: string | null;
  cerrado_por_nombre?: string | null;
  gastos?: GastoDiario[];
  inversiones?: InversionSocio[];
  created_at?: string;
  updated_at?: string;
}

export interface UltimoCierre {
  id: number;
  cerrado_at: string | null;
  cerrado_por: string | null;
  total_ventas: string;
  resultado: string;
}

export interface ResumenDia {
  fecha: string;
  cierre_caja: CierreCaja | null;
  pedidos: Pedido[];
  productos_vendidos?: ProductoVendido[];
  ultimo_cierre?: UltimoCierre | null;
  resumen: {
    total_pedidos: number;
    total_ventas: string;
    ventas_efectivo: string;
    ventas_transferencia: string;
    ventas_transferencia_calculado?: string;
    ventas_tarjeta: string;
    ventas_sin_registro: string;
    monto_apertura: string;
    total_gastos: string;
    gastos_efectivo: string;
    gastos_transferencia: string;
    total_inversiones: string;
    resultado: string;
  };
}

export interface ProductoVendido {
  nombre: string;
  tipo: "item" | "promo";
  cantidad: number;
  ingreso: string;
}

export interface HistorialCierre {
  id: number;
  fecha: string;
  monto_apertura: string;
  total_ventas: string;
  total_pedidos: number;
  ventas_efectivo: string;
  ventas_transferencia: string;
  ventas_tarjeta: string;
  total_gastos: string;
  total_inversiones: string;
  resultado: string;
  cerrado: boolean;
  cerrado_at: string | null;
  cerrado_por: string | null;
  observaciones: string;
}

export interface HistorialResponse {
  desde: string;
  hasta: string;
  cierres: HistorialCierre[];
  totales: {
    total_ventas: string;
    total_gastos: string;
    total_inversiones: string;
    resultado: string;
    dias: number;
  };
}
