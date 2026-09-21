-- ------------------------------------------------------------
--  Rename migration: PZR_<tabla> / <tabla>_<atributo>
--
--  Solo renombra. No borra, no crea, no toca ni un valor.
--  Se corre UNA vez sobre una base que ya tiene el esquema
--  viejo cargado con datos (la de docker compose local, o
--  cualquier copia con el DDL anterior).
--
--  OJO: en MySQL, RENAME TABLE y ALTER TABLE hacen commit
--  implicito cada uno (el DDL no es transaccional). Por eso
--  este archivo NO envuelve nada en START TRANSACTION / COMMIT
--  -- seria falsa seguridad, MySQL lo ignora para DDL y cada
--  linea queda aplicada apenas corre, se corte donde se corte.
--  Por eso el respaldo de abajo no es opcional: si el script
--  se corta a la mitad (por ejemplo por un identificador de
--  mas de 64 caracteres, el limite duro de MySQL), la base
--  queda en un estado mixto y hay que restaurar el respaldo
--  antes de volver a correrlo.
--
--  Respaldo (obligatorio antes de correr esto):
--      docker compose exec -T db mysqldump -u root -praiz db_rutas_turisticas > respaldo.sql
--
--  Restaurar si algo sale mal:
--      docker compose exec -T db mysql -u root -praiz db_rutas_turisticas < respaldo.sql
-- ------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;

RENAME TABLE `UsuariosRutas` TO `PZR_usuariosrutas`;
RENAME TABLE `categorias` TO `PZR_categorias`;
RENAME TABLE `contactos` TO `PZR_contactos`;
RENAME TABLE `mensajes_contactenos` TO `PZR_mensajes_contactenos`;
RENAME TABLE `ubicaciones` TO `PZR_ubicaciones`;
RENAME TABLE `atracciones` TO `PZR_atracciones`;
RENAME TABLE `atracciones_categorias_categorias` TO `PZR_atracciones_categorias_categorias`;
RENAME TABLE `atracciones_contactos_contactos` TO `PZR_atracciones_contactos_contactos`;
RENAME TABLE `calificaciones` TO `PZR_calificaciones`;
RENAME TABLE `eventos` TO `PZR_eventos`;
RENAME TABLE `eventos_atracciones_atracciones` TO `PZR_eventos_atracciones_atracciones`;
RENAME TABLE `eventos_contactos_contactos` TO `PZR_eventos_contactos_contactos`;
RENAME TABLE `hoteles` TO `PZR_hoteles`;
RENAME TABLE `hoteles_categorias_categorias` TO `PZR_hoteles_categorias_categorias`;
RENAME TABLE `hoteles_contactos_contactos` TO `PZR_hoteles_contactos_contactos`;
RENAME TABLE `imagenes` TO `PZR_imagenes`;
RENAME TABLE `imagenes_eventos` TO `PZR_imagenes_eventos`;
RENAME TABLE `imagenes_hoteles` TO `PZR_imagenes_hoteles`;
RENAME TABLE `oficinas_turisticas` TO `PZR_oficinas_turisticas`;
RENAME TABLE `oficinas_turisticas_contactos_contactos` TO `PZR_oficinas_turisticas_contactos_contactos`;
RENAME TABLE `operadores_turisticos` TO `PZR_operadores_turisticos`;
RENAME TABLE `operadores_turisticos_contactos_contactos` TO `PZR_operadores_turisticos_contactos_contactos`;
RENAME TABLE `rentadoras_vehiculos` TO `PZR_rentadoras_vehiculos`;
RENAME TABLE `rentadoras_vehiculos_contactos_contactos` TO `PZR_rentadoras_vehiculos_contactos_contactos`;
RENAME TABLE `restaurantes` TO `PZR_restaurantes`;
RENAME TABLE `restaurantes_contactos_contactos` TO `PZR_restaurantes_contactos_contactos`;
RENAME TABLE `rutas_turisticas` TO `PZR_rutas_turisticas`;
RENAME TABLE `rutas_turisticas_atracciones_atracciones` TO `PZR_rutas_turisticas_atracciones_atracciones`;
RENAME TABLE `eventos_hoteles_hoteles` TO `PZR_eventos_hoteles_hoteles`;
RENAME TABLE `eventos_oficinas_oficinas_turisticas` TO `PZR_eventos_oficinas_oficinas_turisticas`;
RENAME TABLE `eventos_operadores_operadores_turisticos` TO `PZR_eventos_operadores_operadores_turisticos`;
RENAME TABLE `eventos_rentadoras_rentadoras_vehiculos` TO `PZR_eventos_rentadoras_rentadoras_vehiculos`;
RENAME TABLE `eventos_restaurantes_restaurantes` TO `PZR_eventos_restaurantes_restaurantes`;
RENAME TABLE `imagenes_oficinas_turisticas` TO `PZR_imagenes_oficinas_turisticas`;
RENAME TABLE `imagenes_operadores_turisticos` TO `PZR_imagenes_operadores_turisticos`;
RENAME TABLE `imagenes_rentadoras_vehiculos` TO `PZR_imagenes_rentadoras_vehiculos`;
RENAME TABLE `imagenes_restaurantes` TO `PZR_imagenes_restaurantes`;

-- PZR_usuariosrutas
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `id` `usuariosrutas_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `nombre` `usuariosrutas_nombre` text;
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `email` `usuariosrutas_email` text;
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `password` `usuariosrutas_password` text;
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `state` `usuariosrutas_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `rol` `usuariosrutas_rol` text;
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `createdAt` `usuariosrutas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_usuariosrutas` CHANGE COLUMN `updateAt` `usuariosrutas_update_at` timestamp NULL DEFAULT NULL;

-- PZR_categorias
ALTER TABLE `PZR_categorias` CHANGE COLUMN `id` `categorias_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_categorias` CHANGE COLUMN `nombre` `categorias_nombre` text NOT NULL;
ALTER TABLE `PZR_categorias` CHANGE COLUMN `descripcion` `categorias_descripcion` text NOT NULL;
ALTER TABLE `PZR_categorias` CHANGE COLUMN `state` `categorias_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_categorias` CHANGE COLUMN `createdAt` `categorias_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_categorias` CHANGE COLUMN `updateAt` `categorias_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_categorias` CHANGE COLUMN `nombreIngles` `categorias_nombre_ingles` text NOT NULL;
ALTER TABLE `PZR_categorias` CHANGE COLUMN `descripcionIngles` `categorias_descripcion_ingles` text NOT NULL;

-- PZR_contactos
ALTER TABLE `PZR_contactos` CHANGE COLUMN `id` `contactos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_contactos` CHANGE COLUMN `valor` `contactos_valor` text NOT NULL;
ALTER TABLE `PZR_contactos` CHANGE COLUMN `tipo` `contactos_tipo` text NOT NULL;
ALTER TABLE `PZR_contactos` CHANGE COLUMN `state` `contactos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_contactos` CHANGE COLUMN `createdAt` `contactos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_contactos` CHANGE COLUMN `updateAt` `contactos_update_at` timestamp NULL DEFAULT NULL;

-- PZR_mensajes_contactenos
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `id` `mensajes_contactenos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `nombre` `mensajes_contactenos_nombre` text NOT NULL;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `correo` `mensajes_contactenos_correo` text NOT NULL;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `asunto` `mensajes_contactenos_asunto` text NOT NULL;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `mensaje` `mensajes_contactenos_mensaje` text NOT NULL;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `estado` `mensajes_contactenos_estado` text NOT NULL;
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `state` `mensajes_contactenos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `createdAt` `mensajes_contactenos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_mensajes_contactenos` CHANGE COLUMN `updateAt` `mensajes_contactenos_update_at` timestamp NULL DEFAULT NULL;

-- PZR_ubicaciones
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `id` `ubicaciones_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `provincia` `ubicaciones_provincia` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `canton` `ubicaciones_canton` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `distrito` `ubicaciones_distrito` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `detalle` `ubicaciones_detalle` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `latitud` `ubicaciones_latitud` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `longitud` `ubicaciones_longitud` text NOT NULL;
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `state` `ubicaciones_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `createdAt` `ubicaciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_ubicaciones` CHANGE COLUMN `updateAt` `ubicaciones_update_at` timestamp NULL DEFAULT NULL;

-- PZR_atracciones
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `id` `atracciones_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `nombre` `atracciones_nombre` text NOT NULL;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `descripcion` `atracciones_descripcion` text NOT NULL;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `state` `atracciones_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `createdAt` `atracciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `updateAt` `atracciones_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `ubicacionId` `atracciones_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `declaracionTuristica` `atracciones_declaracion_turistica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `descripcionIngles` `atracciones_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenMascotas` `atracciones_permiten_mascotas` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenNinos` `atracciones_permiten_ninos` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadVisual` `atracciones_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadAuditiva` `atracciones_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadFisica` `atracciones_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadCognitiva` `atracciones_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadSicosocial` `atracciones_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenMascotasDescripcion` `atracciones_permiten_mascotas_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenMascotasDescripcionIngles` `atracciones_permiten_mascotas_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenNinosDescripcion` `atracciones_permiten_ninos_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `permitenNinosDescripcionIngles` `atracciones_permiten_ninos_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadVisualDescripcion` `atracciones_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `atracciones_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadAuditivaDescripcion` `atracciones_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `atracciones_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadFisicaDescripcion` `atracciones_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `atracciones_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadCognitivaDescripcion` `atracciones_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `atracciones_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadSicosocialDescripcion` `atracciones_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_atracciones` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `atracciones_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_atracciones_categorias_categorias
ALTER TABLE `PZR_atracciones_categorias_categorias` CHANGE COLUMN `atraccionesId` `atracciones_categorias_categorias_atracciones_id` int NOT NULL;
ALTER TABLE `PZR_atracciones_categorias_categorias` CHANGE COLUMN `categoriasId` `atracciones_categorias_categorias_categorias_id` int NOT NULL;

-- PZR_atracciones_contactos_contactos
ALTER TABLE `PZR_atracciones_contactos_contactos` CHANGE COLUMN `atraccionesId` `atracciones_contactos_contactos_atracciones_id` int NOT NULL;
ALTER TABLE `PZR_atracciones_contactos_contactos` CHANGE COLUMN `contactosId` `atracciones_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_calificaciones
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `id` `calificaciones_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `descripcion` `calificaciones_descripcion` text;
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `state` `calificaciones_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `createdAt` `calificaciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `updateAt` `calificaciones_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `usuarioId` `calificaciones_usuario_id` int DEFAULT NULL;
ALTER TABLE `PZR_calificaciones` CHANGE COLUMN `atraccionId` `calificaciones_atraccion_id` int DEFAULT NULL;

-- PZR_eventos
ALTER TABLE `PZR_eventos` CHANGE COLUMN `id` `eventos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `nombre` `eventos_nombre` text NOT NULL;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `nombreIngles` `eventos_nombre_ingles` text NOT NULL;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `descripcion` `eventos_descripcion` text NOT NULL;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `descripcionIngles` `eventos_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `fechaInicio` `eventos_fecha_inicio` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_eventos` CHANGE COLUMN `fechaFin` `eventos_fecha_fin` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_eventos` CHANGE COLUMN `mostrarFechaInicio` `eventos_mostrar_fecha_inicio` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_eventos` CHANGE COLUMN `mostrarFechaFin` `eventos_mostrar_fecha_fin` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_eventos` CHANGE COLUMN `state` `eventos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_eventos` CHANGE COLUMN `createdAt` `eventos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_eventos` CHANGE COLUMN `updateAt` `eventos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_eventos` CHANGE COLUMN `ubicacionId` `eventos_ubicacion_id` int DEFAULT NULL;

-- PZR_eventos_atracciones_atracciones
ALTER TABLE `PZR_eventos_atracciones_atracciones` CHANGE COLUMN `eventosId` `eventos_atracciones_atracciones_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_atracciones_atracciones` CHANGE COLUMN `atraccionesId` `eventos_atracciones_atracciones_atracciones_id` int NOT NULL;

-- PZR_eventos_contactos_contactos
ALTER TABLE `PZR_eventos_contactos_contactos` CHANGE COLUMN `eventosId` `eventos_contactos_contactos_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_contactos_contactos` CHANGE COLUMN `contactosId` `eventos_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_hoteles
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `id` `hoteles_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `nombre` `hoteles_nombre` text NOT NULL;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `state` `hoteles_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `createdAt` `hoteles_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `updateAt` `hoteles_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `ubicacionId` `hoteles_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `descripcion` `hoteles_descripcion` text NOT NULL;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `declaracionTuristica` `hoteles_declaracion_turistica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `descripcionIngles` `hoteles_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenMascotas` `hoteles_permiten_mascotas` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenNinos` `hoteles_permiten_ninos` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadVisual` `hoteles_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadAuditiva` `hoteles_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadFisica` `hoteles_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadCognitiva` `hoteles_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadSicosocial` `hoteles_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenMascotasDescripcion` `hoteles_permiten_mascotas_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenMascotasDescripcionIngles` `hoteles_permiten_mascotas_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenNinosDescripcion` `hoteles_permiten_ninos_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `permitenNinosDescripcionIngles` `hoteles_permiten_ninos_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadVisualDescripcion` `hoteles_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `hoteles_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadAuditivaDescripcion` `hoteles_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `hoteles_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadFisicaDescripcion` `hoteles_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `hoteles_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadCognitivaDescripcion` `hoteles_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `hoteles_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadSicosocialDescripcion` `hoteles_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_hoteles` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `hoteles_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_hoteles_categorias_categorias
ALTER TABLE `PZR_hoteles_categorias_categorias` CHANGE COLUMN `hotelesId` `hoteles_categorias_categorias_hoteles_id` int NOT NULL;
ALTER TABLE `PZR_hoteles_categorias_categorias` CHANGE COLUMN `categoriasId` `hoteles_categorias_categorias_categorias_id` int NOT NULL;

-- PZR_hoteles_contactos_contactos
ALTER TABLE `PZR_hoteles_contactos_contactos` CHANGE COLUMN `hotelesId` `hoteles_contactos_contactos_hoteles_id` int NOT NULL;
ALTER TABLE `PZR_hoteles_contactos_contactos` CHANGE COLUMN `contactosId` `hoteles_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_imagenes
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `id` `imagenes_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `nombre` `imagenes_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `descripcion` `imagenes_descripcion` text;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `url` `imagenes_url` text NOT NULL;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `state` `imagenes_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `createdAt` `imagenes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `updateAt` `imagenes_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `atraccionId` `imagenes_atraccion_id` int DEFAULT NULL;
ALTER TABLE `PZR_imagenes` CHANGE COLUMN `nameUrl` `imagenes_name_url` text NOT NULL;

-- PZR_imagenes_eventos
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `id` `imagenes_eventos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `nombre` `imagenes_eventos_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `descripcion` `imagenes_eventos_descripcion` text;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `url` `imagenes_eventos_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `nameUrl` `imagenes_eventos_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `state` `imagenes_eventos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `createdAt` `imagenes_eventos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `updateAt` `imagenes_eventos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_eventos` CHANGE COLUMN `eventoId` `imagenes_eventos_evento_id` int DEFAULT NULL;

-- PZR_imagenes_hoteles
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `id` `imagenes_hoteles_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `nombre` `imagenes_hoteles_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `descripcion` `imagenes_hoteles_descripcion` text;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `url` `imagenes_hoteles_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `nameUrl` `imagenes_hoteles_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `state` `imagenes_hoteles_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `createdAt` `imagenes_hoteles_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `updateAt` `imagenes_hoteles_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_hoteles` CHANGE COLUMN `hotelId` `imagenes_hoteles_hotel_id` int DEFAULT NULL;

-- PZR_oficinas_turisticas
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `id` `oficinas_turisticas_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `nombre` `oficinas_turisticas_nombre` text NOT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `nombreEncargado` `oficinas_turisticas_nombre_encargado` text NOT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `descripcion` `oficinas_turisticas_descripcion` text NOT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `state` `oficinas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `createdAt` `oficinas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `updateAt` `oficinas_turisticas_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `ubicacionId` `oficinas_turisticas_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `declaracionTuristica` `oficinas_turisticas_declaracion_turistica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `descripcionIngles` `oficinas_turisticas_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadVisual` `oficinas_turisticas_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadAuditiva` `oficinas_turisticas_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadFisica` `oficinas_turisticas_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadCognitiva` `oficinas_turisticas_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadSicosocial` `oficinas_turisticas_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadVisualDescripcion` `oficinas_turisticas_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `oficinas_turisticas_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadAuditivaDescripcion` `oficinas_turisticas_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `oficinas_turisticas_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadFisicaDescripcion` `oficinas_turisticas_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `oficinas_turisticas_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadCognitivaDescripcion` `oficinas_turisticas_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `oficinas_turisticas_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadSicosocialDescripcion` `oficinas_turisticas_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_oficinas_turisticas` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `oficinas_turisticas_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_oficinas_turisticas_contactos_contactos
ALTER TABLE `PZR_oficinas_turisticas_contactos_contactos` CHANGE COLUMN `oficinasTuristicasId` `oficinas_turisticas_contactos_contactos_oficinas_turisticas_id` int NOT NULL;
ALTER TABLE `PZR_oficinas_turisticas_contactos_contactos` CHANGE COLUMN `contactosId` `oficinas_turisticas_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_operadores_turisticos
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `id` `operadores_turisticos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `nombre` `operadores_turisticos_nombre` text NOT NULL;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `descripcion` `operadores_turisticos_descripcion` text NOT NULL;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `state` `operadores_turisticos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `createdAt` `operadores_turisticos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `updateAt` `operadores_turisticos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `ubicacionId` `operadores_turisticos_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `declaracionTuristica` `operadores_turisticos_declaracion_turistica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `descripcionIngles` `operadores_turisticos_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadVisual` `operadores_turisticos_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadAuditiva` `operadores_turisticos_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadFisica` `operadores_turisticos_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadCognitiva` `operadores_turisticos_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadSicosocial` `operadores_turisticos_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadVisualDescripcion` `operadores_turisticos_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `operadores_turisticos_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadAuditivaDescripcion` `operadores_turisticos_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `operadores_turisticos_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadFisicaDescripcion` `operadores_turisticos_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `operadores_turisticos_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadCognitivaDescripcion` `operadores_turisticos_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `operadores_turisticos_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadSicosocialDescripcion` `operadores_turisticos_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_operadores_turisticos` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `operadores_turisticos_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_operadores_turisticos_contactos_contactos
ALTER TABLE `PZR_operadores_turisticos_contactos_contactos` CHANGE COLUMN `operadoresTuristicosId` `operadores_turisticos_contactos_contactos_operadores_id` int NOT NULL;
ALTER TABLE `PZR_operadores_turisticos_contactos_contactos` CHANGE COLUMN `contactosId` `operadores_turisticos_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_rentadoras_vehiculos
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `id` `rentadoras_vehiculos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `nombre` `rentadoras_vehiculos_nombre` text NOT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `descripcion` `rentadoras_vehiculos_descripcion` text NOT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `state` `rentadoras_vehiculos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `createdAt` `rentadoras_vehiculos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `updateAt` `rentadoras_vehiculos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `ubicacionId` `rentadoras_vehiculos_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `descripcionIngles` `rentadoras_vehiculos_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadVisual` `rentadoras_vehiculos_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadAuditiva` `rentadoras_vehiculos_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadFisica` `rentadoras_vehiculos_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadCognitiva` `rentadoras_vehiculos_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadSicosocial` `rentadoras_vehiculos_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadVisualDescripcion` `rentadoras_vehiculos_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `rentadoras_vehiculos_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadAuditivaDescripcion` `rentadoras_vehiculos_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `rentadoras_vehiculos_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadFisicaDescripcion` `rentadoras_vehiculos_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `rentadoras_vehiculos_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadCognitivaDescripcion` `rentadoras_vehiculos_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `rentadoras_vehiculos_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadSicosocialDescripcion` `rentadoras_vehiculos_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_rentadoras_vehiculos` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `rentadoras_vehiculos_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_rentadoras_vehiculos_contactos_contactos
ALTER TABLE `PZR_rentadoras_vehiculos_contactos_contactos` CHANGE COLUMN `rentadorasVehiculosId` `rentadoras_vehiculos_contactos_contactos_rentadoras_vehiculos_id` int NOT NULL;
ALTER TABLE `PZR_rentadoras_vehiculos_contactos_contactos` CHANGE COLUMN `contactosId` `rentadoras_vehiculos_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_restaurantes
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `id` `restaurantes_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `nombre` `restaurantes_nombre` text NOT NULL;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `state` `restaurantes_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `createdAt` `restaurantes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `updateAt` `restaurantes_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `ubicacionId` `restaurantes_ubicacion_id` int DEFAULT NULL;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `declaracionTuristica` `restaurantes_declaracion_turistica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `descripcion` `restaurantes_descripcion` text NOT NULL;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `descripcionIngles` `restaurantes_descripcion_ingles` text NOT NULL;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenMascotas` `restaurantes_permiten_mascotas` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenNinos` `restaurantes_permiten_ninos` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadVisual` `restaurantes_discapacidad_visual` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadAuditiva` `restaurantes_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadFisica` `restaurantes_discapacidad_fisica` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadCognitiva` `restaurantes_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadSicosocial` `restaurantes_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0';
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenMascotasDescripcion` `restaurantes_permiten_mascotas_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenMascotasDescripcionIngles` `restaurantes_permiten_mascotas_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenNinosDescripcion` `restaurantes_permiten_ninos_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `permitenNinosDescripcionIngles` `restaurantes_permiten_ninos_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadVisualDescripcion` `restaurantes_discapacidad_visual_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadVisualDescripcionIngles` `restaurantes_discapacidad_visual_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadAuditivaDescripcion` `restaurantes_discapacidad_auditiva_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadAuditivaDescripcionIngles` `restaurantes_discapacidad_auditiva_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadFisicaDescripcion` `restaurantes_discapacidad_fisica_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadFisicaDescripcionIngles` `restaurantes_discapacidad_fisica_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadCognitivaDescripcion` `restaurantes_discapacidad_cognitiva_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadCognitivaDescripcionIngles` `restaurantes_discapacidad_cognitiva_descripcion_ingles` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadSicosocialDescripcion` `restaurantes_discapacidad_sicosocial_descripcion` text;
ALTER TABLE `PZR_restaurantes` CHANGE COLUMN `discapacidadSicosocialDescripcionIngles` `restaurantes_discapacidad_sicosocial_descripcion_ingles` text;

-- PZR_restaurantes_contactos_contactos
ALTER TABLE `PZR_restaurantes_contactos_contactos` CHANGE COLUMN `restaurantesId` `restaurantes_contactos_contactos_restaurantes_id` int NOT NULL;
ALTER TABLE `PZR_restaurantes_contactos_contactos` CHANGE COLUMN `contactosId` `restaurantes_contactos_contactos_contactos_id` int NOT NULL;

-- PZR_rutas_turisticas
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `id` `rutas_turisticas_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `nombre` `rutas_turisticas_nombre` text NOT NULL;
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `state` `rutas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `createdAt` `rutas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `updateAt` `rutas_turisticas_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_rutas_turisticas` CHANGE COLUMN `usuarioId` `rutas_turisticas_usuario_id` int DEFAULT NULL;

-- PZR_rutas_turisticas_atracciones_atracciones
ALTER TABLE `PZR_rutas_turisticas_atracciones_atracciones` CHANGE COLUMN `rutasTuristicasId` `rutas_turisticas_atracciones_atracciones_rutas_turisticas_id` int NOT NULL;
ALTER TABLE `PZR_rutas_turisticas_atracciones_atracciones` CHANGE COLUMN `atraccionesId` `rutas_turisticas_atracciones_atracciones_atracciones_id` int NOT NULL;

-- PZR_eventos_hoteles_hoteles
ALTER TABLE `PZR_eventos_hoteles_hoteles` CHANGE COLUMN `eventosId` `eventos_hoteles_hoteles_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_hoteles_hoteles` CHANGE COLUMN `hotelesId` `eventos_hoteles_hoteles_hoteles_id` int NOT NULL;

-- PZR_eventos_oficinas_oficinas_turisticas
ALTER TABLE `PZR_eventos_oficinas_oficinas_turisticas` CHANGE COLUMN `eventosId` `eventos_oficinas_oficinas_turisticas_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_oficinas_oficinas_turisticas` CHANGE COLUMN `oficinasTuristicasId` `eventos_oficinas_oficinas_turisticas_oficinas_turisticas_id` int NOT NULL;

-- PZR_eventos_operadores_operadores_turisticos
ALTER TABLE `PZR_eventos_operadores_operadores_turisticos` CHANGE COLUMN `eventosId` `eventos_operadores_operadores_turisticos_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_operadores_operadores_turisticos` CHANGE COLUMN `operadoresTuristicosId` `eventos_operadores_operadores_turisticos_operadores_id` int NOT NULL;

-- PZR_eventos_rentadoras_rentadoras_vehiculos
ALTER TABLE `PZR_eventos_rentadoras_rentadoras_vehiculos` CHANGE COLUMN `eventosId` `eventos_rentadoras_rentadoras_vehiculos_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_rentadoras_rentadoras_vehiculos` CHANGE COLUMN `rentadorasVehiculosId` `eventos_rentadoras_rentadoras_vehiculos_rentadoras_vehiculos_id` int NOT NULL;

-- PZR_eventos_restaurantes_restaurantes
ALTER TABLE `PZR_eventos_restaurantes_restaurantes` CHANGE COLUMN `eventosId` `eventos_restaurantes_restaurantes_eventos_id` int NOT NULL;
ALTER TABLE `PZR_eventos_restaurantes_restaurantes` CHANGE COLUMN `restaurantesId` `eventos_restaurantes_restaurantes_restaurantes_id` int NOT NULL;

-- PZR_imagenes_oficinas_turisticas
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `id` `imagenes_oficinas_turisticas_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `nombre` `imagenes_oficinas_turisticas_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `descripcion` `imagenes_oficinas_turisticas_descripcion` text;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `url` `imagenes_oficinas_turisticas_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `nameUrl` `imagenes_oficinas_turisticas_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `state` `imagenes_oficinas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `createdAt` `imagenes_oficinas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `updateAt` `imagenes_oficinas_turisticas_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_oficinas_turisticas` CHANGE COLUMN `oficinaTuristicaId` `imagenes_oficinas_turisticas_oficina_turistica_id` int DEFAULT NULL;

-- PZR_imagenes_operadores_turisticos
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `id` `imagenes_operadores_turisticos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `nombre` `imagenes_operadores_turisticos_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `descripcion` `imagenes_operadores_turisticos_descripcion` text;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `url` `imagenes_operadores_turisticos_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `nameUrl` `imagenes_operadores_turisticos_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `state` `imagenes_operadores_turisticos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `createdAt` `imagenes_operadores_turisticos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `updateAt` `imagenes_operadores_turisticos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_operadores_turisticos` CHANGE COLUMN `operadorTuristicoId` `imagenes_operadores_turisticos_operador_turistico_id` int DEFAULT NULL;

-- PZR_imagenes_rentadoras_vehiculos
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `id` `imagenes_rentadoras_vehiculos_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `nombre` `imagenes_rentadoras_vehiculos_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `descripcion` `imagenes_rentadoras_vehiculos_descripcion` text;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `url` `imagenes_rentadoras_vehiculos_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `nameUrl` `imagenes_rentadoras_vehiculos_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `state` `imagenes_rentadoras_vehiculos_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `createdAt` `imagenes_rentadoras_vehiculos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `updateAt` `imagenes_rentadoras_vehiculos_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_rentadoras_vehiculos` CHANGE COLUMN `rentadoraVehiculosId` `imagenes_rentadoras_vehiculos_rentadora_vehiculos_id` int DEFAULT NULL;

-- PZR_imagenes_restaurantes
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `id` `imagenes_restaurantes_id` int NOT NULL AUTO_INCREMENT;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `nombre` `imagenes_restaurantes_nombre` text NOT NULL;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `descripcion` `imagenes_restaurantes_descripcion` text;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `url` `imagenes_restaurantes_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `nameUrl` `imagenes_restaurantes_name_url` text NOT NULL;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `state` `imagenes_restaurantes_state` varchar(255) NOT NULL DEFAULT 'Active';
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `createdAt` `imagenes_restaurantes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `updateAt` `imagenes_restaurantes_update_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `PZR_imagenes_restaurantes` CHANGE COLUMN `restauranteId` `imagenes_restaurantes_restaurante_id` int DEFAULT NULL;

SET FOREIGN_KEY_CHECKS = 1;
