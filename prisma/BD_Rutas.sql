-- db_rutas_turisticas.PZR_usuariosrutas definition

CREATE TABLE `PZR_usuariosrutas` (
  `usuariosrutas_id` int NOT NULL AUTO_INCREMENT,
  `usuariosrutas_nombre` text,
  `usuariosrutas_email` text,
  `usuariosrutas_password` text,
  `usuariosrutas_state` varchar(255) NOT NULL DEFAULT 'Active',
  `usuariosrutas_rol` text,
  `usuariosrutas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `usuariosrutas_update_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`usuariosrutas_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_categorias definition

CREATE TABLE `PZR_categorias` (
  `categorias_id` int NOT NULL AUTO_INCREMENT,
  `categorias_nombre` text NOT NULL,
  `categorias_descripcion` text NOT NULL,
  `categorias_state` varchar(255) NOT NULL DEFAULT 'Active',
  `categorias_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `categorias_update_at` timestamp NULL DEFAULT NULL,
  `categorias_nombre_ingles` text NOT NULL,
  `categorias_descripcion_ingles` text NOT NULL,
  PRIMARY KEY (`categorias_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_contactos definition

CREATE TABLE `PZR_contactos` (
  `contactos_id` int NOT NULL AUTO_INCREMENT,
  `contactos_valor` text NOT NULL,
  `contactos_tipo` text NOT NULL,
  `contactos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `contactos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `contactos_update_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`contactos_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_mensajes_contactenos definition

CREATE TABLE `PZR_mensajes_contactenos` (
  `mensajes_contactenos_id` int NOT NULL AUTO_INCREMENT,
  `mensajes_contactenos_nombre` text NOT NULL,
  `mensajes_contactenos_correo` text NOT NULL,
  `mensajes_contactenos_asunto` text NOT NULL,
  `mensajes_contactenos_mensaje` text NOT NULL,
  `mensajes_contactenos_estado` text NOT NULL,
  `mensajes_contactenos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `mensajes_contactenos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mensajes_contactenos_update_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`mensajes_contactenos_id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_ubicaciones definition

CREATE TABLE `PZR_ubicaciones` (
  `ubicaciones_id` int NOT NULL AUTO_INCREMENT,
  `ubicaciones_provincia` text NOT NULL,
  `ubicaciones_canton` text NOT NULL,
  `ubicaciones_distrito` text NOT NULL,
  `ubicaciones_detalle` text NOT NULL,
  `ubicaciones_latitud` text NOT NULL,
  `ubicaciones_longitud` text NOT NULL,
  `ubicaciones_state` varchar(255) NOT NULL DEFAULT 'Active',
  `ubicaciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ubicaciones_update_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=724 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_atracciones definition

CREATE TABLE `PZR_atracciones` (
  `atracciones_id` int NOT NULL AUTO_INCREMENT,
  `atracciones_nombre` text NOT NULL,
  `atracciones_descripcion` text NOT NULL,
  `atracciones_state` varchar(255) NOT NULL DEFAULT 'Active',
  `atracciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `atracciones_update_at` timestamp NULL DEFAULT NULL,
  `atracciones_ubicacion_id` int DEFAULT NULL,
  `atracciones_declaracion_turistica` tinyint NOT NULL DEFAULT '0',
  `atracciones_descripcion_ingles` text NOT NULL,
  `atracciones_permiten_mascotas` tinyint NOT NULL DEFAULT '0',
  `atracciones_permiten_ninos` tinyint NOT NULL DEFAULT '0',
  `atracciones_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `atracciones_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `atracciones_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `atracciones_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `atracciones_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `atracciones_permiten_mascotas_descripcion` text,
  `atracciones_permiten_mascotas_descripcion_ingles` text,
  `atracciones_permiten_ninos_descripcion` text,
  `atracciones_permiten_ninos_descripcion_ingles` text,
  `atracciones_discapacidad_visual_descripcion` text,
  `atracciones_discapacidad_visual_descripcion_ingles` text,
  `atracciones_discapacidad_auditiva_descripcion` text,
  `atracciones_discapacidad_auditiva_descripcion_ingles` text,
  `atracciones_discapacidad_fisica_descripcion` text,
  `atracciones_discapacidad_fisica_descripcion_ingles` text,
  `atracciones_discapacidad_cognitiva_descripcion` text,
  `atracciones_discapacidad_cognitiva_descripcion_ingles` text,
  `atracciones_discapacidad_sicosocial_descripcion` text,
  `atracciones_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`atracciones_id`),
  KEY `FK_81720e7cb4b389b5a76167ba237` (`atracciones_ubicacion_id`),
  CONSTRAINT `FK_81720e7cb4b389b5a76167ba237` FOREIGN KEY (`atracciones_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=294 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_atracciones_categorias_categorias definition

CREATE TABLE `PZR_atracciones_categorias_categorias` (
  `atracciones_categorias_categorias_atracciones_id` int NOT NULL,
  `atracciones_categorias_categorias_categorias_id` int NOT NULL,
  PRIMARY KEY (`atracciones_categorias_categorias_atracciones_id`,`atracciones_categorias_categorias_categorias_id`),
  KEY `IDX_b4c7a088b70770e0ec7be60f46` (`atracciones_categorias_categorias_atracciones_id`),
  KEY `IDX_3ebefb1668f46abefd185a777b` (`atracciones_categorias_categorias_categorias_id`),
  CONSTRAINT `FK_3ebefb1668f46abefd185a777b1` FOREIGN KEY (`atracciones_categorias_categorias_categorias_id`) REFERENCES `PZR_categorias` (`categorias_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_b4c7a088b70770e0ec7be60f464` FOREIGN KEY (`atracciones_categorias_categorias_atracciones_id`) REFERENCES `PZR_atracciones` (`atracciones_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_atracciones_contactos_contactos definition

CREATE TABLE `PZR_atracciones_contactos_contactos` (
  `atracciones_contactos_contactos_atracciones_id` int NOT NULL,
  `atracciones_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`atracciones_contactos_contactos_atracciones_id`,`atracciones_contactos_contactos_contactos_id`),
  KEY `IDX_10af72ec1291cce878685fe588` (`atracciones_contactos_contactos_atracciones_id`),
  KEY `IDX_c59061cd2937f864a2c16919c9` (`atracciones_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_10af72ec1291cce878685fe588a` FOREIGN KEY (`atracciones_contactos_contactos_atracciones_id`) REFERENCES `PZR_atracciones` (`atracciones_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_c59061cd2937f864a2c16919c9d` FOREIGN KEY (`atracciones_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_calificaciones definition

CREATE TABLE `PZR_calificaciones` (
  `calificaciones_id` int NOT NULL AUTO_INCREMENT,
  `calificaciones_descripcion` text,
  `calificaciones_state` varchar(255) NOT NULL DEFAULT 'Active',
  `calificaciones_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `calificaciones_update_at` timestamp NULL DEFAULT NULL,
  `calificaciones_usuario_id` int DEFAULT NULL,
  `calificaciones_atraccion_id` int DEFAULT NULL,
  PRIMARY KEY (`calificaciones_id`),
  KEY `FK_375603f03606312da8761092b02` (`calificaciones_usuario_id`),
  KEY `FK_022fa75c069a1df0503780aae78` (`calificaciones_atraccion_id`),
  CONSTRAINT `FK_022fa75c069a1df0503780aae78` FOREIGN KEY (`calificaciones_atraccion_id`) REFERENCES `PZR_atracciones` (`atracciones_id`),
  CONSTRAINT `FK_375603f03606312da8761092b02` FOREIGN KEY (`calificaciones_usuario_id`) REFERENCES `PZR_usuariosrutas` (`usuariosrutas_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos definition

CREATE TABLE `PZR_eventos` (
  `eventos_id` int NOT NULL AUTO_INCREMENT,
  `eventos_nombre` text NOT NULL,
  `eventos_nombre_ingles` text NOT NULL,
  `eventos_descripcion` text NOT NULL,
  `eventos_descripcion_ingles` text NOT NULL,
  `eventos_fecha_inicio` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `eventos_fecha_fin` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `eventos_mostrar_fecha_inicio` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `eventos_mostrar_fecha_fin` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `eventos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `eventos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `eventos_update_at` timestamp NULL DEFAULT NULL,
  `eventos_ubicacion_id` int DEFAULT NULL,
  PRIMARY KEY (`eventos_id`),
  KEY `FK_bf05ddd0161d427170cdfa79f6c` (`eventos_ubicacion_id`),
  CONSTRAINT `FK_bf05ddd0161d427170cdfa79f6c` FOREIGN KEY (`eventos_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_atracciones_atracciones definition

CREATE TABLE `PZR_eventos_atracciones_atracciones` (
  `eventos_atracciones_atracciones_eventos_id` int NOT NULL,
  `eventos_atracciones_atracciones_atracciones_id` int NOT NULL,
  PRIMARY KEY (`eventos_atracciones_atracciones_eventos_id`,`eventos_atracciones_atracciones_atracciones_id`),
  KEY `IDX_666f0ed4403c43b1262c364e72` (`eventos_atracciones_atracciones_eventos_id`),
  KEY `IDX_8f715781487c50afa6c73cc4aa` (`eventos_atracciones_atracciones_atracciones_id`),
  CONSTRAINT `FK_666f0ed4403c43b1262c364e72d` FOREIGN KEY (`eventos_atracciones_atracciones_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_8f715781487c50afa6c73cc4aa0` FOREIGN KEY (`eventos_atracciones_atracciones_atracciones_id`) REFERENCES `PZR_atracciones` (`atracciones_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_contactos_contactos definition

CREATE TABLE `PZR_eventos_contactos_contactos` (
  `eventos_contactos_contactos_eventos_id` int NOT NULL,
  `eventos_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`eventos_contactos_contactos_eventos_id`,`eventos_contactos_contactos_contactos_id`),
  KEY `IDX_8bbb6ee40efe4d42cb10ce999c` (`eventos_contactos_contactos_eventos_id`),
  KEY `IDX_e1b95bd329d81074784ea97213` (`eventos_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_8bbb6ee40efe4d42cb10ce999c6` FOREIGN KEY (`eventos_contactos_contactos_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e1b95bd329d81074784ea97213d` FOREIGN KEY (`eventos_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_hoteles definition

CREATE TABLE `PZR_hoteles` (
  `hoteles_id` int NOT NULL AUTO_INCREMENT,
  `hoteles_nombre` text NOT NULL,
  `hoteles_state` varchar(255) NOT NULL DEFAULT 'Active',
  `hoteles_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `hoteles_update_at` timestamp NULL DEFAULT NULL,
  `hoteles_ubicacion_id` int DEFAULT NULL,
  `hoteles_descripcion` text NOT NULL,
  `hoteles_declaracion_turistica` tinyint NOT NULL DEFAULT '0',
  `hoteles_descripcion_ingles` text NOT NULL,
  `hoteles_permiten_mascotas` tinyint NOT NULL DEFAULT '0',
  `hoteles_permiten_ninos` tinyint NOT NULL DEFAULT '0',
  `hoteles_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `hoteles_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `hoteles_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `hoteles_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `hoteles_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `hoteles_permiten_mascotas_descripcion` text,
  `hoteles_permiten_mascotas_descripcion_ingles` text,
  `hoteles_permiten_ninos_descripcion` text,
  `hoteles_permiten_ninos_descripcion_ingles` text,
  `hoteles_discapacidad_visual_descripcion` text,
  `hoteles_discapacidad_visual_descripcion_ingles` text,
  `hoteles_discapacidad_auditiva_descripcion` text,
  `hoteles_discapacidad_auditiva_descripcion_ingles` text,
  `hoteles_discapacidad_fisica_descripcion` text,
  `hoteles_discapacidad_fisica_descripcion_ingles` text,
  `hoteles_discapacidad_cognitiva_descripcion` text,
  `hoteles_discapacidad_cognitiva_descripcion_ingles` text,
  `hoteles_discapacidad_sicosocial_descripcion` text,
  `hoteles_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`hoteles_id`),
  KEY `FK_65a1aeff5910e2a866a91a30c7e` (`hoteles_ubicacion_id`),
  CONSTRAINT `FK_65a1aeff5910e2a866a91a30c7e` FOREIGN KEY (`hoteles_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_hoteles_categorias_categorias definition

CREATE TABLE `PZR_hoteles_categorias_categorias` (
  `hoteles_categorias_categorias_hoteles_id` int NOT NULL,
  `hoteles_categorias_categorias_categorias_id` int NOT NULL,
  PRIMARY KEY (`hoteles_categorias_categorias_hoteles_id`,`hoteles_categorias_categorias_categorias_id`),
  KEY `IDX_f12ca8b71b70c8e7229a03cabe` (`hoteles_categorias_categorias_hoteles_id`),
  KEY `IDX_2a09a2fdedd122a7cb936916b8` (`hoteles_categorias_categorias_categorias_id`),
  CONSTRAINT `FK_2a09a2fdedd122a7cb936916b8b` FOREIGN KEY (`hoteles_categorias_categorias_categorias_id`) REFERENCES `PZR_categorias` (`categorias_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_f12ca8b71b70c8e7229a03cabe4` FOREIGN KEY (`hoteles_categorias_categorias_hoteles_id`) REFERENCES `PZR_hoteles` (`hoteles_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_hoteles_contactos_contactos definition

CREATE TABLE `PZR_hoteles_contactos_contactos` (
  `hoteles_contactos_contactos_hoteles_id` int NOT NULL,
  `hoteles_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`hoteles_contactos_contactos_hoteles_id`,`hoteles_contactos_contactos_contactos_id`),
  KEY `IDX_d1b33fa3cf01e44b515707f24e` (`hoteles_contactos_contactos_hoteles_id`),
  KEY `IDX_a42447069818c50ba8a47461da` (`hoteles_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_a42447069818c50ba8a47461da7` FOREIGN KEY (`hoteles_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_d1b33fa3cf01e44b515707f24e9` FOREIGN KEY (`hoteles_contactos_contactos_hoteles_id`) REFERENCES `PZR_hoteles` (`hoteles_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes definition

CREATE TABLE `PZR_imagenes` (
  `imagenes_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_nombre` text NOT NULL,
  `imagenes_descripcion` text,
  `imagenes_url` text NOT NULL,
  `imagenes_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_atraccion_id` int DEFAULT NULL,
  `imagenes_name_url` text NOT NULL,
  PRIMARY KEY (`imagenes_id`),
  KEY `FK_b3fdee2454758ed6d0cfc95ca59` (`imagenes_atraccion_id`),
  CONSTRAINT `FK_b3fdee2454758ed6d0cfc95ca59` FOREIGN KEY (`imagenes_atraccion_id`) REFERENCES `PZR_atracciones` (`atracciones_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1041 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_eventos definition

CREATE TABLE `PZR_imagenes_eventos` (
  `imagenes_eventos_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_eventos_nombre` text NOT NULL,
  `imagenes_eventos_descripcion` text,
  `imagenes_eventos_url` text NOT NULL,
  `imagenes_eventos_name_url` text NOT NULL,
  `imagenes_eventos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_eventos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_eventos_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_eventos_evento_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_eventos_id`),
  KEY `FK_5392ae7cb65cef8b1d2ded15d67` (`imagenes_eventos_evento_id`),
  CONSTRAINT `FK_5392ae7cb65cef8b1d2ded15d67` FOREIGN KEY (`imagenes_eventos_evento_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_hoteles definition

CREATE TABLE `PZR_imagenes_hoteles` (
  `imagenes_hoteles_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_hoteles_nombre` text NOT NULL,
  `imagenes_hoteles_descripcion` text,
  `imagenes_hoteles_url` text NOT NULL,
  `imagenes_hoteles_name_url` text NOT NULL,
  `imagenes_hoteles_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_hoteles_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_hoteles_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_hoteles_hotel_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_hoteles_id`),
  KEY `FK_e6b0d8526441eedbed48b1344ec` (`imagenes_hoteles_hotel_id`),
  CONSTRAINT `FK_e6b0d8526441eedbed48b1344ec` FOREIGN KEY (`imagenes_hoteles_hotel_id`) REFERENCES `PZR_hoteles` (`hoteles_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=440 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_oficinas_turisticas definition

CREATE TABLE `PZR_oficinas_turisticas` (
  `oficinas_turisticas_id` int NOT NULL AUTO_INCREMENT,
  `oficinas_turisticas_nombre` text NOT NULL,
  `oficinas_turisticas_nombre_encargado` text NOT NULL,
  `oficinas_turisticas_descripcion` text NOT NULL,
  `oficinas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active',
  `oficinas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `oficinas_turisticas_update_at` timestamp NULL DEFAULT NULL,
  `oficinas_turisticas_ubicacion_id` int DEFAULT NULL,
  `oficinas_turisticas_declaracion_turistica` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_descripcion_ingles` text NOT NULL,
  `oficinas_turisticas_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `oficinas_turisticas_discapacidad_visual_descripcion` text,
  `oficinas_turisticas_discapacidad_visual_descripcion_ingles` text,
  `oficinas_turisticas_discapacidad_auditiva_descripcion` text,
  `oficinas_turisticas_discapacidad_auditiva_descripcion_ingles` text,
  `oficinas_turisticas_discapacidad_fisica_descripcion` text,
  `oficinas_turisticas_discapacidad_fisica_descripcion_ingles` text,
  `oficinas_turisticas_discapacidad_cognitiva_descripcion` text,
  `oficinas_turisticas_discapacidad_cognitiva_descripcion_ingles` text,
  `oficinas_turisticas_discapacidad_sicosocial_descripcion` text,
  `oficinas_turisticas_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`oficinas_turisticas_id`),
  KEY `FK_9005a5700caf9e762401e65bc4b` (`oficinas_turisticas_ubicacion_id`),
  CONSTRAINT `FK_9005a5700caf9e762401e65bc4b` FOREIGN KEY (`oficinas_turisticas_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_oficinas_turisticas_contactos_contactos definition

CREATE TABLE `PZR_oficinas_turisticas_contactos_contactos` (
  `oficinas_turisticas_contactos_contactos_oficinas_turisticas_id` int NOT NULL,
  `oficinas_turisticas_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`oficinas_turisticas_contactos_contactos_oficinas_turisticas_id`,`oficinas_turisticas_contactos_contactos_contactos_id`),
  KEY `IDX_42f2c3be59b324bdd019ab14fc` (`oficinas_turisticas_contactos_contactos_oficinas_turisticas_id`),
  KEY `IDX_e04ff379e1d18820b29102ab4e` (`oficinas_turisticas_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_42f2c3be59b324bdd019ab14fcc` FOREIGN KEY (`oficinas_turisticas_contactos_contactos_oficinas_turisticas_id`) REFERENCES `PZR_oficinas_turisticas` (`oficinas_turisticas_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e04ff379e1d18820b29102ab4e8` FOREIGN KEY (`oficinas_turisticas_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_operadores_turisticos definition

CREATE TABLE `PZR_operadores_turisticos` (
  `operadores_turisticos_id` int NOT NULL AUTO_INCREMENT,
  `operadores_turisticos_nombre` text NOT NULL,
  `operadores_turisticos_descripcion` text NOT NULL,
  `operadores_turisticos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `operadores_turisticos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `operadores_turisticos_update_at` timestamp NULL DEFAULT NULL,
  `operadores_turisticos_ubicacion_id` int DEFAULT NULL,
  `operadores_turisticos_declaracion_turistica` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_descripcion_ingles` text NOT NULL,
  `operadores_turisticos_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `operadores_turisticos_discapacidad_visual_descripcion` text,
  `operadores_turisticos_discapacidad_visual_descripcion_ingles` text,
  `operadores_turisticos_discapacidad_auditiva_descripcion` text,
  `operadores_turisticos_discapacidad_auditiva_descripcion_ingles` text,
  `operadores_turisticos_discapacidad_fisica_descripcion` text,
  `operadores_turisticos_discapacidad_fisica_descripcion_ingles` text,
  `operadores_turisticos_discapacidad_cognitiva_descripcion` text,
  `operadores_turisticos_discapacidad_cognitiva_descripcion_ingles` text,
  `operadores_turisticos_discapacidad_sicosocial_descripcion` text,
  `operadores_turisticos_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`operadores_turisticos_id`),
  KEY `FK_01037fa45d53750b6b88b3bab2e` (`operadores_turisticos_ubicacion_id`),
  CONSTRAINT `FK_01037fa45d53750b6b88b3bab2e` FOREIGN KEY (`operadores_turisticos_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_operadores_turisticos_contactos_contactos definition

CREATE TABLE `PZR_operadores_turisticos_contactos_contactos` (
  `operadores_turisticos_contactos_contactos_operadores_id` int NOT NULL,
  `operadores_turisticos_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`operadores_turisticos_contactos_contactos_operadores_id`,`operadores_turisticos_contactos_contactos_contactos_id`),
  KEY `IDX_8af59eba939cf043966cda6b40` (`operadores_turisticos_contactos_contactos_operadores_id`),
  KEY `IDX_55edcc8427b39b606d861aa0ab` (`operadores_turisticos_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_55edcc8427b39b606d861aa0ab0` FOREIGN KEY (`operadores_turisticos_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_8af59eba939cf043966cda6b401` FOREIGN KEY (`operadores_turisticos_contactos_contactos_operadores_id`) REFERENCES `PZR_operadores_turisticos` (`operadores_turisticos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_rentadoras_vehiculos definition

CREATE TABLE `PZR_rentadoras_vehiculos` (
  `rentadoras_vehiculos_id` int NOT NULL AUTO_INCREMENT,
  `rentadoras_vehiculos_nombre` text NOT NULL,
  `rentadoras_vehiculos_descripcion` text NOT NULL,
  `rentadoras_vehiculos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `rentadoras_vehiculos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `rentadoras_vehiculos_update_at` timestamp NULL DEFAULT NULL,
  `rentadoras_vehiculos_ubicacion_id` int DEFAULT NULL,
  `rentadoras_vehiculos_descripcion_ingles` text NOT NULL,
  `rentadoras_vehiculos_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `rentadoras_vehiculos_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `rentadoras_vehiculos_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `rentadoras_vehiculos_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `rentadoras_vehiculos_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `rentadoras_vehiculos_discapacidad_visual_descripcion` text,
  `rentadoras_vehiculos_discapacidad_visual_descripcion_ingles` text,
  `rentadoras_vehiculos_discapacidad_auditiva_descripcion` text,
  `rentadoras_vehiculos_discapacidad_auditiva_descripcion_ingles` text,
  `rentadoras_vehiculos_discapacidad_fisica_descripcion` text,
  `rentadoras_vehiculos_discapacidad_fisica_descripcion_ingles` text,
  `rentadoras_vehiculos_discapacidad_cognitiva_descripcion` text,
  `rentadoras_vehiculos_discapacidad_cognitiva_descripcion_ingles` text,
  `rentadoras_vehiculos_discapacidad_sicosocial_descripcion` text,
  `rentadoras_vehiculos_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`rentadoras_vehiculos_id`),
  KEY `FK_addce49626c69818e9698ec19a6` (`rentadoras_vehiculos_ubicacion_id`),
  CONSTRAINT `FK_addce49626c69818e9698ec19a6` FOREIGN KEY (`rentadoras_vehiculos_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_rentadoras_vehiculos_contactos_contactos definition

CREATE TABLE `PZR_rentadoras_vehiculos_contactos_contactos` (
  `rentadoras_vehiculos_contactos_contactos_rentadoras_vehiculos_id` int NOT NULL,
  `rentadoras_vehiculos_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`rentadoras_vehiculos_contactos_contactos_rentadoras_vehiculos_id`,`rentadoras_vehiculos_contactos_contactos_contactos_id`),
  KEY `IDX_91315dfe359baa14665935565b` (`rentadoras_vehiculos_contactos_contactos_rentadoras_vehiculos_id`),
  KEY `IDX_0f811d2caaf375ed4d8fc25b6a` (`rentadoras_vehiculos_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_0f811d2caaf375ed4d8fc25b6a7` FOREIGN KEY (`rentadoras_vehiculos_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_91315dfe359baa14665935565bc` FOREIGN KEY (`rentadoras_vehiculos_contactos_contactos_rentadoras_vehiculos_id`) REFERENCES `PZR_rentadoras_vehiculos` (`rentadoras_vehiculos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_restaurantes definition

CREATE TABLE `PZR_restaurantes` (
  `restaurantes_id` int NOT NULL AUTO_INCREMENT,
  `restaurantes_nombre` text NOT NULL,
  `restaurantes_state` varchar(255) NOT NULL DEFAULT 'Active',
  `restaurantes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `restaurantes_update_at` timestamp NULL DEFAULT NULL,
  `restaurantes_ubicacion_id` int DEFAULT NULL,
  `restaurantes_declaracion_turistica` tinyint NOT NULL DEFAULT '0',
  `restaurantes_descripcion` text NOT NULL,
  `restaurantes_descripcion_ingles` text NOT NULL,
  `restaurantes_permiten_mascotas` tinyint NOT NULL DEFAULT '0',
  `restaurantes_permiten_ninos` tinyint NOT NULL DEFAULT '0',
  `restaurantes_discapacidad_visual` tinyint NOT NULL DEFAULT '0',
  `restaurantes_discapacidad_auditiva` tinyint NOT NULL DEFAULT '0',
  `restaurantes_discapacidad_fisica` tinyint NOT NULL DEFAULT '0',
  `restaurantes_discapacidad_cognitiva` tinyint NOT NULL DEFAULT '0',
  `restaurantes_discapacidad_sicosocial` tinyint NOT NULL DEFAULT '0',
  `restaurantes_permiten_mascotas_descripcion` text,
  `restaurantes_permiten_mascotas_descripcion_ingles` text,
  `restaurantes_permiten_ninos_descripcion` text,
  `restaurantes_permiten_ninos_descripcion_ingles` text,
  `restaurantes_discapacidad_visual_descripcion` text,
  `restaurantes_discapacidad_visual_descripcion_ingles` text,
  `restaurantes_discapacidad_auditiva_descripcion` text,
  `restaurantes_discapacidad_auditiva_descripcion_ingles` text,
  `restaurantes_discapacidad_fisica_descripcion` text,
  `restaurantes_discapacidad_fisica_descripcion_ingles` text,
  `restaurantes_discapacidad_cognitiva_descripcion` text,
  `restaurantes_discapacidad_cognitiva_descripcion_ingles` text,
  `restaurantes_discapacidad_sicosocial_descripcion` text,
  `restaurantes_discapacidad_sicosocial_descripcion_ingles` text,
  PRIMARY KEY (`restaurantes_id`),
  KEY `FK_8b87c9e6ac61922720c1c372965` (`restaurantes_ubicacion_id`),
  CONSTRAINT `FK_8b87c9e6ac61922720c1c372965` FOREIGN KEY (`restaurantes_ubicacion_id`) REFERENCES `PZR_ubicaciones` (`ubicaciones_id`)
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_restaurantes_contactos_contactos definition

CREATE TABLE `PZR_restaurantes_contactos_contactos` (
  `restaurantes_contactos_contactos_restaurantes_id` int NOT NULL,
  `restaurantes_contactos_contactos_contactos_id` int NOT NULL,
  PRIMARY KEY (`restaurantes_contactos_contactos_restaurantes_id`,`restaurantes_contactos_contactos_contactos_id`),
  KEY `IDX_3a540c48e528af870b4aa8b4a8` (`restaurantes_contactos_contactos_restaurantes_id`),
  KEY `IDX_cf442cab6d9957791812dc9350` (`restaurantes_contactos_contactos_contactos_id`),
  CONSTRAINT `FK_3a540c48e528af870b4aa8b4a8d` FOREIGN KEY (`restaurantes_contactos_contactos_restaurantes_id`) REFERENCES `PZR_restaurantes` (`restaurantes_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_cf442cab6d9957791812dc9350c` FOREIGN KEY (`restaurantes_contactos_contactos_contactos_id`) REFERENCES `PZR_contactos` (`contactos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_rutas_turisticas definition

CREATE TABLE `PZR_rutas_turisticas` (
  `rutas_turisticas_id` int NOT NULL AUTO_INCREMENT,
  `rutas_turisticas_nombre` text NOT NULL,
  `rutas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active',
  `rutas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `rutas_turisticas_update_at` timestamp NULL DEFAULT NULL,
  `rutas_turisticas_usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`rutas_turisticas_id`),
  KEY `FK_db80f47a037a849dfb7b4d940ed` (`rutas_turisticas_usuario_id`),
  CONSTRAINT `FK_db80f47a037a849dfb7b4d940ed` FOREIGN KEY (`rutas_turisticas_usuario_id`) REFERENCES `PZR_usuariosrutas` (`usuariosrutas_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_rutas_turisticas_atracciones_atracciones definition

CREATE TABLE `PZR_rutas_turisticas_atracciones_atracciones` (
  `rutas_turisticas_atracciones_atracciones_rutas_turisticas_id` int NOT NULL,
  `rutas_turisticas_atracciones_atracciones_atracciones_id` int NOT NULL,
  PRIMARY KEY (`rutas_turisticas_atracciones_atracciones_rutas_turisticas_id`,`rutas_turisticas_atracciones_atracciones_atracciones_id`),
  KEY `IDX_e8c5d41e5f3ae4b36417731e57` (`rutas_turisticas_atracciones_atracciones_rutas_turisticas_id`),
  KEY `IDX_7959656f847a86fa9c075c5dc0` (`rutas_turisticas_atracciones_atracciones_atracciones_id`),
  CONSTRAINT `FK_7959656f847a86fa9c075c5dc02` FOREIGN KEY (`rutas_turisticas_atracciones_atracciones_atracciones_id`) REFERENCES `PZR_atracciones` (`atracciones_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e8c5d41e5f3ae4b36417731e570` FOREIGN KEY (`rutas_turisticas_atracciones_atracciones_rutas_turisticas_id`) REFERENCES `PZR_rutas_turisticas` (`rutas_turisticas_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_hoteles_hoteles definition

CREATE TABLE `PZR_eventos_hoteles_hoteles` (
  `eventos_hoteles_hoteles_eventos_id` int NOT NULL,
  `eventos_hoteles_hoteles_hoteles_id` int NOT NULL,
  PRIMARY KEY (`eventos_hoteles_hoteles_eventos_id`,`eventos_hoteles_hoteles_hoteles_id`),
  KEY `IDX_cf0ba38c98ced0ecfce998d836` (`eventos_hoteles_hoteles_eventos_id`),
  KEY `IDX_e69dceca98231fce8b9353507e` (`eventos_hoteles_hoteles_hoteles_id`),
  CONSTRAINT `FK_cf0ba38c98ced0ecfce998d8366` FOREIGN KEY (`eventos_hoteles_hoteles_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e69dceca98231fce8b9353507e0` FOREIGN KEY (`eventos_hoteles_hoteles_hoteles_id`) REFERENCES `PZR_hoteles` (`hoteles_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_oficinas_oficinas_turisticas definition

CREATE TABLE `PZR_eventos_oficinas_oficinas_turisticas` (
  `eventos_oficinas_oficinas_turisticas_eventos_id` int NOT NULL,
  `eventos_oficinas_oficinas_turisticas_oficinas_turisticas_id` int NOT NULL,
  PRIMARY KEY (`eventos_oficinas_oficinas_turisticas_eventos_id`,`eventos_oficinas_oficinas_turisticas_oficinas_turisticas_id`),
  KEY `IDX_19d8c617422d1a2485f580dd60` (`eventos_oficinas_oficinas_turisticas_eventos_id`),
  KEY `IDX_8665d7523878f878b06a0ec00a` (`eventos_oficinas_oficinas_turisticas_oficinas_turisticas_id`),
  CONSTRAINT `FK_19d8c617422d1a2485f580dd60e` FOREIGN KEY (`eventos_oficinas_oficinas_turisticas_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_8665d7523878f878b06a0ec00a7` FOREIGN KEY (`eventos_oficinas_oficinas_turisticas_oficinas_turisticas_id`) REFERENCES `PZR_oficinas_turisticas` (`oficinas_turisticas_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_operadores_operadores_turisticos definition

CREATE TABLE `PZR_eventos_operadores_operadores_turisticos` (
  `eventos_operadores_operadores_turisticos_eventos_id` int NOT NULL,
  `eventos_operadores_operadores_turisticos_operadores_id` int NOT NULL,
  PRIMARY KEY (`eventos_operadores_operadores_turisticos_eventos_id`,`eventos_operadores_operadores_turisticos_operadores_id`),
  KEY `IDX_e492720ae061baace4ff898c41` (`eventos_operadores_operadores_turisticos_eventos_id`),
  KEY `IDX_a36198809aadc7ccd10b7030b0` (`eventos_operadores_operadores_turisticos_operadores_id`),
  CONSTRAINT `FK_a36198809aadc7ccd10b7030b0b` FOREIGN KEY (`eventos_operadores_operadores_turisticos_operadores_id`) REFERENCES `PZR_operadores_turisticos` (`operadores_turisticos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e492720ae061baace4ff898c416` FOREIGN KEY (`eventos_operadores_operadores_turisticos_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_rentadoras_rentadoras_vehiculos definition

CREATE TABLE `PZR_eventos_rentadoras_rentadoras_vehiculos` (
  `eventos_rentadoras_rentadoras_vehiculos_eventos_id` int NOT NULL,
  `eventos_rentadoras_rentadoras_vehiculos_rentadoras_vehiculos_id` int NOT NULL,
  PRIMARY KEY (`eventos_rentadoras_rentadoras_vehiculos_eventos_id`,`eventos_rentadoras_rentadoras_vehiculos_rentadoras_vehiculos_id`),
  KEY `IDX_bebb2057523c25ed9e147e3933` (`eventos_rentadoras_rentadoras_vehiculos_eventos_id`),
  KEY `IDX_9f355d165c718c07b70a160351` (`eventos_rentadoras_rentadoras_vehiculos_rentadoras_vehiculos_id`),
  CONSTRAINT `FK_9f355d165c718c07b70a160351d` FOREIGN KEY (`eventos_rentadoras_rentadoras_vehiculos_rentadoras_vehiculos_id`) REFERENCES `PZR_rentadoras_vehiculos` (`rentadoras_vehiculos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_bebb2057523c25ed9e147e3933f` FOREIGN KEY (`eventos_rentadoras_rentadoras_vehiculos_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_eventos_restaurantes_restaurantes definition

CREATE TABLE `PZR_eventos_restaurantes_restaurantes` (
  `eventos_restaurantes_restaurantes_eventos_id` int NOT NULL,
  `eventos_restaurantes_restaurantes_restaurantes_id` int NOT NULL,
  PRIMARY KEY (`eventos_restaurantes_restaurantes_eventos_id`,`eventos_restaurantes_restaurantes_restaurantes_id`),
  KEY `IDX_639653f542f2c99992342a2c74` (`eventos_restaurantes_restaurantes_eventos_id`),
  KEY `IDX_78d1a5a9aed0f3299ebddd04e4` (`eventos_restaurantes_restaurantes_restaurantes_id`),
  CONSTRAINT `FK_639653f542f2c99992342a2c742` FOREIGN KEY (`eventos_restaurantes_restaurantes_eventos_id`) REFERENCES `PZR_eventos` (`eventos_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_78d1a5a9aed0f3299ebddd04e48` FOREIGN KEY (`eventos_restaurantes_restaurantes_restaurantes_id`) REFERENCES `PZR_restaurantes` (`restaurantes_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_oficinas_turisticas definition

CREATE TABLE `PZR_imagenes_oficinas_turisticas` (
  `imagenes_oficinas_turisticas_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_oficinas_turisticas_nombre` text NOT NULL,
  `imagenes_oficinas_turisticas_descripcion` text,
  `imagenes_oficinas_turisticas_url` text NOT NULL,
  `imagenes_oficinas_turisticas_name_url` text NOT NULL,
  `imagenes_oficinas_turisticas_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_oficinas_turisticas_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_oficinas_turisticas_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_oficinas_turisticas_oficina_turistica_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_oficinas_turisticas_id`),
  KEY `FK_f77b7cd43e05b9cd539d1985909` (`imagenes_oficinas_turisticas_oficina_turistica_id`),
  CONSTRAINT `FK_f77b7cd43e05b9cd539d1985909` FOREIGN KEY (`imagenes_oficinas_turisticas_oficina_turistica_id`) REFERENCES `PZR_oficinas_turisticas` (`oficinas_turisticas_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_operadores_turisticos definition

CREATE TABLE `PZR_imagenes_operadores_turisticos` (
  `imagenes_operadores_turisticos_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_operadores_turisticos_nombre` text NOT NULL,
  `imagenes_operadores_turisticos_descripcion` text,
  `imagenes_operadores_turisticos_url` text NOT NULL,
  `imagenes_operadores_turisticos_name_url` text NOT NULL,
  `imagenes_operadores_turisticos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_operadores_turisticos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_operadores_turisticos_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_operadores_turisticos_operador_turistico_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_operadores_turisticos_id`),
  KEY `FK_a495ebc0a9a02901df63bc5e491` (`imagenes_operadores_turisticos_operador_turistico_id`),
  CONSTRAINT `FK_a495ebc0a9a02901df63bc5e491` FOREIGN KEY (`imagenes_operadores_turisticos_operador_turistico_id`) REFERENCES `PZR_operadores_turisticos` (`operadores_turisticos_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_rentadoras_vehiculos definition

CREATE TABLE `PZR_imagenes_rentadoras_vehiculos` (
  `imagenes_rentadoras_vehiculos_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_rentadoras_vehiculos_nombre` text NOT NULL,
  `imagenes_rentadoras_vehiculos_descripcion` text,
  `imagenes_rentadoras_vehiculos_url` text NOT NULL,
  `imagenes_rentadoras_vehiculos_name_url` text NOT NULL,
  `imagenes_rentadoras_vehiculos_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_rentadoras_vehiculos_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_rentadoras_vehiculos_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_rentadoras_vehiculos_rentadora_vehiculos_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_rentadoras_vehiculos_id`),
  KEY `FK_8b3b613e62349cf6da3dad04d9a` (`imagenes_rentadoras_vehiculos_rentadora_vehiculos_id`),
  CONSTRAINT `FK_8b3b613e62349cf6da3dad04d9a` FOREIGN KEY (`imagenes_rentadoras_vehiculos_rentadora_vehiculos_id`) REFERENCES `PZR_rentadoras_vehiculos` (`rentadoras_vehiculos_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



-- db_rutas_turisticas.PZR_imagenes_restaurantes definition

CREATE TABLE `PZR_imagenes_restaurantes` (
  `imagenes_restaurantes_id` int NOT NULL AUTO_INCREMENT,
  `imagenes_restaurantes_nombre` text NOT NULL,
  `imagenes_restaurantes_descripcion` text,
  `imagenes_restaurantes_url` text NOT NULL,
  `imagenes_restaurantes_name_url` text NOT NULL,
  `imagenes_restaurantes_state` varchar(255) NOT NULL DEFAULT 'Active',
  `imagenes_restaurantes_created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imagenes_restaurantes_update_at` timestamp NULL DEFAULT NULL,
  `imagenes_restaurantes_restaurante_id` int DEFAULT NULL,
  PRIMARY KEY (`imagenes_restaurantes_id`),
  KEY `FK_a161e4d5c01b97fa8ff0b9b9349` (`imagenes_restaurantes_restaurante_id`),
  CONSTRAINT `FK_a161e4d5c01b97fa8ff0b9b9349` FOREIGN KEY (`imagenes_restaurantes_restaurante_id`) REFERENCES `PZR_restaurantes` (`restaurantes_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=315 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
