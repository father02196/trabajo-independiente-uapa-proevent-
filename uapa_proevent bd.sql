-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 03-05-2026 a las 05:09:17
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `uapa_proevent`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alimento`
--

CREATE TABLE `alimento` (
  `id_alimento` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alimento`
--

INSERT INTO `alimento` (`id_alimento`, `nombre`) VALUES
(1, 'Desayuno'),
(2, 'Coffee Break'),
(3, 'Buffet-Almuerzo'),
(5, 'Refigerio ');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bitacora_movimiento`
--

CREATE TABLE `bitacora_movimiento` (
  `id_bitacora` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `accion` varchar(150) NOT NULL,
  `detalles` text DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bitacora_movimiento`
--

INSERT INTO `bitacora_movimiento` (`id_bitacora`, `id_usuario`, `id_rol`, `accion`, `detalles`, `fecha`) VALUES
(1, 18, 1, 'LOGIN', 'Inicio de sesión manual exitoso', '2026-03-15 15:31:26'),
(2, 18, 1, 'LOGIN', 'Inicio de sesión manual exitoso', '2026-03-15 15:52:48'),
(3, 18, 1, 'LOGIN', 'Inicio de sesión manual exitoso', '2026-03-15 15:55:16'),
(4, 18, 1, 'CREACION_USUARIO', 'Se creó el usuario Father021967@gmail.com con rol 3', '2026-03-15 15:57:51'),
(5, 18, 1, 'ACTUALIZACION_USUARIO', 'Se actualizó el usuario ID 21', '2026-03-15 16:00:14'),
(6, 18, 1, 'ELIMINACION_USUARIO', 'Se eliminó el usuario ID 21', '2026-03-15 16:02:24'),
(7, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 16:15:09'),
(8, 18, 1, 'CREACION_USUARIO', 'Registro de nuevo usuario. ID asignado: 22, Nombre: Victor Diaz, Correo: Father021967@gmail.com, Nivel de Rol ID: 3.', '2026-03-15 16:16:12'),
(9, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 22:22:37'),
(10, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 22:55:32'),
(11, 18, 1, 'LOGIN_GOOGLE', 'Sesión Inicada (Google OAuth). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 23:01:01'),
(12, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 23:12:02'),
(13, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 23:12:58'),
(14, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-15 23:30:00'),
(15, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-16 00:07:44'),
(16, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-16 23:07:08'),
(17, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-16 23:41:39'),
(18, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-17 00:41:58'),
(19, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 00:45:35'),
(20, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:03:27'),
(21, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:05:52'),
(22, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:06:09'),
(23, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:20:34'),
(24, 18, 1, 'CREACION_USUARIO', 'Registro de nuevo usuario. ID asignado: 23, Nombre: Ismael Cruz , Correo: 100042222@p.uapa.edu.do, Nivel de Rol ID: 4.', '2026-03-17 01:21:30'),
(25, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 01:21:52'),
(26, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:23:32'),
(27, 18, 1, 'CREACION_USUARIO', 'Registro de nuevo usuario. ID asignado: 24, Nombre: manuel, Correo: 100041111@p.uapa.edu.do, Nivel de Rol ID: 5.', '2026-03-17 01:24:09'),
(28, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-17 01:24:29'),
(29, 24, 5, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 13. Título: \"Reunion publica  - Reunion publica de\". Modalidad: Presencial. Cantidad de Asistentes: 2000. Creado para dependencia ID: 7.', '2026-03-17 01:28:07'),
(30, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 6 ha pasado al estado: \"Rechazado\".', '2026-03-17 01:28:35'),
(31, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 12 ha pasado al estado: \"Rechazado\".', '2026-03-17 01:28:53'),
(32, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 1 ha pasado al estado: \"Rechazado\".', '2026-03-17 01:28:59'),
(33, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 10 ha pasado al estado: \"Rechazado\".', '2026-03-17 01:29:04'),
(34, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 01:31:19'),
(35, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:32:16'),
(36, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-17 01:39:57'),
(37, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-17 01:47:01'),
(38, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 01:47:59'),
(39, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 01:48:55'),
(40, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 22:42:08'),
(41, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 23:00:08'),
(42, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 23:00:43'),
(43, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 23:01:59'),
(44, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 23:02:48'),
(45, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-17 23:05:43'),
(46, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-17 23:19:15'),
(47, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-17 23:19:46'),
(48, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-17 23:57:56'),
(49, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 18:32:22'),
(50, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 18:36:50'),
(51, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-18 18:38:20'),
(52, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-18 18:39:28'),
(53, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 20:23:52'),
(54, 18, 1, 'LOGIN_GOOGLE', 'Sesión Inicada (Google OAuth). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 20:28:16'),
(55, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 20:30:34'),
(56, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-18 20:33:47'),
(57, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 20:42:49'),
(58, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-18 20:43:31'),
(59, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 21:00:26'),
(60, 18, 1, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 14. Título: \"charla \". Modalidad: Virtual. Cantidad de Asistentes: 40. Creado para dependencia ID: 8.', '2026-03-18 21:07:32'),
(61, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-18 23:20:18'),
(62, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 19:39:12'),
(63, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 19:54:58'),
(64, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-19 19:55:59'),
(65, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 20:04:38'),
(66, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 20:27:44'),
(67, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 15. Título: \"Evento de prueba 1\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 20:29:45'),
(68, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 16. Título: \"Evento de prueba 2\". Modalidad: Presencial. Cantidad de Asistentes: 60. Creado para dependencia ID: 1.', '2026-03-19 20:30:58'),
(69, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 20:37:56'),
(70, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 17. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:33'),
(71, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 18. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:36'),
(72, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 19. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:38'),
(73, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 20. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:40'),
(74, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 21. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:53'),
(75, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 22. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:53'),
(76, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 23. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:54'),
(77, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 24. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:54'),
(78, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 25. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:54'),
(79, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 26. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:54'),
(80, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 27. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:55'),
(81, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 28. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:55'),
(82, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 29. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:55'),
(83, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 30. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:55'),
(84, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 31. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:41:56'),
(85, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 32. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:42:00'),
(86, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 33. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:42:00'),
(87, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 34. Título: \"Reunion de compañero\". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 3.', '2026-03-19 20:42:00'),
(88, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 20:51:07'),
(89, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 35. Título: \"Evento de Prueba Audiovisual\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 20:53:14'),
(90, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 35. Equipos requeridos: Cámaras (Grabación), Transmisión en vivo.', '2026-03-19 20:53:14'),
(91, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 36. Título: \"Evento Sin Audiovisual\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 20:55:00'),
(92, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 37. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:58:49'),
(93, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 38. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:58:52'),
(94, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 39. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:58:53'),
(95, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 40. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:01'),
(96, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 41. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:01'),
(97, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 42. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:04'),
(98, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 43. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:04'),
(99, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 44. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:05'),
(100, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 45. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:05'),
(101, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 46. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:05'),
(102, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 47. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:05'),
(103, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 48. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:06'),
(104, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 49. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:06'),
(105, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 50. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:06'),
(106, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 51. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:07'),
(107, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 52. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:07'),
(108, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 53. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:07'),
(109, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 54. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:07'),
(110, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 55. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:08'),
(111, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 56. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:08'),
(112, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 57. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:08'),
(113, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 58. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:08'),
(114, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 59. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:09'),
(115, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 60. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:09'),
(116, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 61. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:09'),
(117, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 62. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:09'),
(118, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 63. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:09'),
(119, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 64. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:10'),
(120, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 65. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:10'),
(121, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 66. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:10'),
(122, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 67. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:10'),
(123, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 68. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:10'),
(124, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 69. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:11'),
(125, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 70. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:11'),
(126, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 71. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:21'),
(127, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 72. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:31'),
(128, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 73. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:32'),
(129, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 74. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:32'),
(130, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 75. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:33'),
(131, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 76. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:33'),
(132, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 77. Título: \"taller \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 12.', '2026-03-19 20:59:33'),
(133, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 78. Título: \"Evento de Prueba AI\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 21:11:36'),
(134, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 21:12:37'),
(135, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 79. Título: \"Evento de Prueba AV SI\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 21:14:34'),
(136, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 80. Título: \"Evento Prueba AV SI Fix\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 21:17:12'),
(137, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 80. Equipos requeridos: Micrófonos, Proyector.', '2026-03-19 21:17:12'),
(138, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 81. Título: \"Evento Prueba AV NO Final\". Modalidad: Presencial. Cantidad de Asistentes: 100. Creado para dependencia ID: 1.', '2026-03-19 21:20:35'),
(139, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 21:28:29'),
(140, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 21:48:00'),
(141, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 21:55:17'),
(142, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 82. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:23'),
(143, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 83. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:24'),
(144, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 84. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:25'),
(145, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 85. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:25'),
(146, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 86. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:26'),
(147, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 87. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:26'),
(148, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 88. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:26'),
(149, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 89. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:26'),
(150, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 90. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:27'),
(151, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 91. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:27'),
(152, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 92. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:27'),
(153, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 93. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:27'),
(154, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 94. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:28'),
(155, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 95. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:28'),
(156, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 96. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:29'),
(157, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 97. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:29'),
(158, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 98. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:29'),
(159, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 99. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:29'),
(160, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 100. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:29'),
(161, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 101. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:30'),
(162, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 102. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:30'),
(163, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 103. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:30'),
(164, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 104. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:31'),
(165, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 105. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:31'),
(166, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 106. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:31'),
(167, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 107. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:31'),
(168, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 108. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:32'),
(169, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 109. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:32'),
(170, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 110. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:32'),
(171, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 111. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:32'),
(172, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 112. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:42'),
(173, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 113. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:43'),
(174, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 114. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:43'),
(175, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 115. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:43'),
(176, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 116. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:44'),
(177, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 117. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:44'),
(178, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 118. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:44'),
(179, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 119. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:44'),
(180, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 120. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:45'),
(181, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 121. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:45'),
(182, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 122. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:45'),
(183, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 123. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:45'),
(184, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 124. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:45'),
(185, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 125. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 20. Creado para dependencia ID: 6.', '2026-03-19 21:57:46'),
(186, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 21:59:57'),
(187, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 126. Título: \"Test Submission Troubleshooting\". Modalidad: Presencial. Cantidad de Asistentes: 50. Creado para dependencia ID: 1.', '2026-03-19 22:01:51'),
(188, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:05:08'),
(189, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:08:22'),
(190, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 127. Título: \"reunion estudiante \". Modalidad: Presencial. Cantidad de Asistentes: 200. Creado para dependencia ID: 8.', '2026-03-19 22:14:02'),
(191, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 128. Título: \"reunion estudiante \". Modalidad: Presencial. Cantidad de Asistentes: 200. Creado para dependencia ID: 8.', '2026-03-19 22:14:04'),
(192, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 129. Título: \"reunion estudiante \". Modalidad: Presencial. Cantidad de Asistentes: 200. Creado para dependencia ID: 8.', '2026-03-19 22:14:05'),
(193, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 130. Título: \"reunion estudiante \". Modalidad: Presencial. Cantidad de Asistentes: 200. Creado para dependencia ID: 8.', '2026-03-19 22:16:04'),
(194, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 130. Equipos requeridos: Camara de alta velocidad , Iluminación.', '2026-03-19 22:16:04'),
(195, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 22:31:21'),
(196, 18, 1, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 130 ha pasado al estado: \"Aprobado\".', '2026-03-19 22:35:00'),
(197, 18, 1, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 130 ha pasado al estado: \"Rechazado\".', '2026-03-19 22:35:32'),
(198, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:40:44'),
(199, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:41:36'),
(200, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:42:15'),
(201, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:42:57'),
(202, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:44:33'),
(203, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:45:30'),
(204, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:46:47'),
(205, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:49:33'),
(206, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:52:04'),
(207, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:54:02'),
(208, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:54:57'),
(209, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:55:41'),
(210, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:56:36'),
(211, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:57:15'),
(212, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:58:25'),
(213, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 22:59:26'),
(214, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:00:38'),
(215, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:01:56'),
(216, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:03:31'),
(217, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:04:21'),
(218, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:06:08'),
(219, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:07:21'),
(220, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:09:11'),
(221, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:11:15'),
(222, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:12:17'),
(223, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 23:29:25'),
(224, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 23:33:33'),
(225, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:33:59'),
(226, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-19 23:36:42'),
(227, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 23:50:22'),
(228, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-19 23:56:56'),
(229, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 00:01:00'),
(230, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-20 00:07:41'),
(231, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 00:11:00'),
(232, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 00:42:03'),
(233, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 131. Título: \"reunion \". Modalidad: Presencial. Cantidad de Asistentes: 200. Creado para dependencia ID: 5.', '2026-03-20 00:45:11'),
(234, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 131. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación, Micrófonos, Pantallas o monitores extras, Proyector.', '2026-03-20 00:45:11'),
(235, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 00:50:48'),
(236, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 00:56:41'),
(237, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-20 00:59:07'),
(238, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 01:00:08'),
(239, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 132. Título: \"reunion audio\". Modalidad: Presencial. Cantidad de Asistentes: 2000. Creado para dependencia ID: 6.', '2026-03-20 01:02:46'),
(240, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 132. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación, Transmisión en vivo, Sistema de sonido.', '2026-03-20 01:02:46'),
(241, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 01:06:40'),
(242, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 01:51:09'),
(243, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 01:52:13'),
(244, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-20 01:53:07'),
(245, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 21:21:13'),
(246, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 130 pasaron al estado: \"Aprobado\".', '2026-03-20 21:29:04'),
(247, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-20 21:29:41'),
(248, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 131 pasaron al estado: \"Aprobado\".', '2026-03-20 21:30:05'),
(249, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 132 pasaron al estado: \"Aprobado\".', '2026-03-20 21:30:08'),
(250, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 21:34:11'),
(251, 23, 4, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 132 ha pasado al estado: \"Aprobado\".', '2026-03-20 21:34:31'),
(252, 23, 4, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 6 ha pasado al estado: \"Aprobado\".', '2026-03-20 21:34:36'),
(253, 23, 4, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 132 ha pasado al estado: \"Rechazado\".', '2026-03-20 21:35:39'),
(254, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-20 21:51:21'),
(255, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 21:53:35'),
(256, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-20 22:00:09'),
(257, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 22:03:02'),
(258, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 22:18:33'),
(259, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"Completado\".', '2026-03-20 22:19:43'),
(260, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"Completado\".', '2026-03-20 22:19:47'),
(261, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"Rechazado\".', '2026-03-20 22:19:51'),
(262, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"En revisión\".', '2026-03-20 22:19:54'),
(263, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"En revisión\".', '2026-03-20 22:19:57'),
(264, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"Completado\".', '2026-03-20 22:20:00'),
(265, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 6 pasaron al estado: \"Completado\".', '2026-03-20 22:20:04'),
(266, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 22:33:05'),
(267, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 22:34:04'),
(268, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 22:37:58'),
(269, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-20 22:40:13'),
(270, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-20 22:40:52'),
(271, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-20 22:41:32'),
(272, 18, 1, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 1 pasaron al estado: \"Completado\".', '2026-03-20 22:42:11'),
(273, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 1 pasaron al estado: \"Completado\".', '2026-03-20 22:42:16'),
(274, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 1 pasaron al estado: \"Aprobado\".', '2026-03-20 22:42:21'),
(275, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-21 00:23:44'),
(276, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-21 00:29:55'),
(277, 1, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Administrador (100049725@p.uapa.edu.do) bajo el rol de Administrador.', '2026-03-21 00:34:20'),
(278, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 01:10:38');
INSERT INTO `bitacora_movimiento` (`id_bitacora`, `id_usuario`, `id_rol`, `accion`, `detalles`, `fecha`) VALUES
(279, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 01:12:04'),
(280, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-21 01:13:08'),
(281, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 01:14:30'),
(282, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 08:49:20'),
(283, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-21 08:50:01'),
(284, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 08:50:24'),
(285, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-21 09:04:46'),
(286, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 133. Título: \"Video\". Modalidad: Virtual. Cantidad de Asistentes: 20. Creado para dependencia ID: 8.', '2026-03-21 09:27:19'),
(287, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 133. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Micrófonos.', '2026-03-21 09:27:19'),
(288, 23, 4, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 133 ha pasado al estado: \"Aprobado\".', '2026-03-21 09:28:05'),
(289, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 13:22:15'),
(290, 18, 1, 'CREACION_USUARIO', 'Registro de nuevo usuario. ID asignado: 25, Nombre: David , Correo: 100045555@p.uapa.edu.do, Nivel de Rol ID: 7.', '2026-03-21 13:24:44'),
(291, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 13:25:27'),
(292, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 13:40:35'),
(293, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 13:47:24'),
(294, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 13:55:41'),
(295, 25, 7, 'CREACION_POA', 'Nuevo presupuesto POA por 4000000.', '2026-03-21 13:56:15'),
(296, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 13:58:46'),
(297, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 134. Título: \"pruebas \".', '2026-03-21 14:04:23'),
(298, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 14:05:13'),
(299, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 1 cambiado a Aprobado.', '2026-03-21 14:30:49'),
(300, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 14:40:42'),
(301, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 135. Título: \"chalas\".', '2026-03-21 15:02:12'),
(302, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 2 cambiado a Rechazado.', '2026-03-21 15:03:59'),
(303, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 15:25:05'),
(304, 25, 7, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 135 ha pasado al estado: \"Aprobado\".', '2026-03-21 15:26:34'),
(305, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 2 cambiado a Aprobado.', '2026-03-21 15:27:13'),
(306, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 2 cambiado a Rechazado.', '2026-03-21 15:27:40'),
(307, 25, 7, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 135 ha pasado al estado: \"Rechazado\".', '2026-03-21 15:29:22'),
(308, 25, 7, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 135 ha pasado al estado: \"Aprobado\".', '2026-03-21 15:34:56'),
(309, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 15:39:06'),
(310, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 16:07:59'),
(311, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 16:12:45'),
(312, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 16:16:54'),
(313, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 16:24:15'),
(314, 22, 3, 'EDICION_EVENTO', 'Evento 135 actualizado.', '2026-03-21 16:25:24'),
(315, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 16:27:21'),
(316, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 2 cambiado a Aprobado.', '2026-03-21 16:28:30'),
(317, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 17:27:12'),
(318, 25, 7, 'CREACION_POA', 'Nuevo presupuesto POA por 4000000.07.', '2026-03-21 17:34:04'),
(319, 22, 3, 'EDICION_EVENTO', 'Evento 135 actualizado.', '2026-03-21 17:38:20'),
(320, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 17:40:46'),
(321, 22, 3, 'EDICION_EVENTO', 'Evento 134 actualizado.', '2026-03-21 17:46:22'),
(322, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 136. Título: \"reunion de sistema \".', '2026-03-21 17:50:29'),
(323, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 3 cambiado a Aprobado.', '2026-03-21 17:50:57'),
(324, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-21 17:51:36'),
(325, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-21 17:52:04'),
(326, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 134 ha pasado al estado: \"Aprobado\".', '2026-03-21 17:52:31'),
(327, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 12 ha pasado al estado: \"Aprobado\".', '2026-03-21 17:53:25'),
(328, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 136 ha pasado al estado: \"Aprobado\".', '2026-03-21 17:54:03'),
(329, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 136 ha pasado al estado: \"Finalizado\".', '2026-03-21 17:59:00'),
(330, 22, 3, 'EDICION_EVENTO', 'Evento 136 actualizado.', '2026-03-21 17:59:39'),
(331, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-21 18:59:45'),
(332, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 2. Evento ID: 136. Recinto: Santiago. Valoración: Excelente. Satisfacción: 4/5.', '2026-03-21 19:01:18'),
(333, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 19:01:45'),
(334, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-21 19:11:01'),
(335, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-21 19:11:21'),
(336, 22, 3, 'AUTO_FINALIZACION_EVENTO', 'El evento \"pruebas sistema \" (ID: 134) fue finalizado automáticamente al superar su fecha de fin.', '2026-03-21 20:57:15'),
(337, 22, 3, 'AUTO_FINALIZACION_EVENTO', 'El evento \"chalas\" (ID: 135) fue finalizado automáticamente al superar su fecha de fin.', '2026-03-21 20:57:15'),
(338, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-22 11:18:28'),
(339, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 3 cambiado a Rechazado.', '2026-03-22 11:21:58'),
(340, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 3 cambiado a Aprobado.', '2026-03-22 11:25:00'),
(341, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-22 11:26:35'),
(342, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 137. Título: \"evento prueba 4\".', '2026-03-22 11:34:20'),
(343, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 4 cambiado a Aprobado.', '2026-03-22 11:36:02'),
(344, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 3 cambiado a Rechazado.', '2026-03-22 11:37:54'),
(345, 22, 3, 'EDICION_EVENTO', 'Evento 137 actualizado.', '2026-03-22 11:43:50'),
(346, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-22 14:02:58'),
(347, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-22 14:03:43'),
(348, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-22 14:04:03'),
(349, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-22 14:04:23'),
(350, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-22 14:05:14'),
(351, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 3. Evento ID: 135. Recinto: Santiago. Valoración: Excelente. Satisfacción: 5/5.', '2026-03-22 14:07:53'),
(352, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 137 ha pasado al estado: \"Finalizado\".', '2026-03-22 14:09:37'),
(353, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-22 14:10:20'),
(354, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 4. Evento ID: 137. Recinto: Santiago. Valoración: Muy eficiente. Satisfacción: 5/5.', '2026-03-22 14:11:06'),
(355, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-22 14:19:37'),
(356, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-22 14:22:33'),
(357, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 138. Título: \"Pruebas de video\".', '2026-03-22 14:27:11'),
(358, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 139. Título: \"Pruebas de video\".', '2026-03-22 14:28:07'),
(359, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 139. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación.', '2026-03-22 14:28:07'),
(360, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Aprobado\".', '2026-03-22 14:30:16'),
(361, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 6 cambiado a Aprobado.', '2026-03-22 14:32:26'),
(362, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 6 cambiado a Rechazado.', '2026-03-22 14:32:53'),
(363, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 6 cambiado a Aprobado.', '2026-03-22 14:33:00'),
(364, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 139 pasaron al estado: \"Aprobado\".', '2026-03-22 14:34:09'),
(365, 22, 3, 'EDICION_EVENTO', 'Evento 139 actualizado.', '2026-03-22 14:38:35'),
(366, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Finalizado\".', '2026-03-22 14:39:14'),
(367, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-22 14:39:41'),
(368, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 5. Evento ID: 139. Recinto: Santiago. Valoración: Muy eficiente. Satisfacción: 4/5.', '2026-03-22 14:40:32'),
(369, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-24 23:33:08'),
(370, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-24 23:34:58'),
(371, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-24 23:37:06'),
(372, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-24 23:38:48'),
(373, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-24 23:44:54'),
(374, 12, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (1000468@uapa.edu.do) bajo el rol de Administrador.', '2026-03-24 23:59:02'),
(375, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-24 23:59:59'),
(376, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-25 00:02:01'),
(377, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-25 00:02:40'),
(378, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-25 00:03:28'),
(379, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-25 16:17:29'),
(380, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-25 17:01:53'),
(381, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-25 17:10:56'),
(382, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-25 17:36:43'),
(383, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-25 17:37:19'),
(384, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-25 17:43:02'),
(385, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-25 18:01:26'),
(386, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-25 19:14:34'),
(387, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-25 21:35:34'),
(388, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-25 21:36:57'),
(389, 18, 1, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 140. Título: \"solicitud prueba\".', '2026-03-25 21:54:03'),
(390, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-25 21:54:40'),
(391, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-25 21:55:23'),
(392, 22, 3, 'EDICION_EVENTO', 'Evento 139 actualizado.', '2026-03-25 22:01:05'),
(393, 18, 1, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Pendiente\".', '2026-03-25 22:04:28'),
(394, 22, 3, 'EDICION_EVENTO', 'Evento 138 actualizado.', '2026-03-25 22:05:59'),
(395, 22, 3, 'EDICION_EVENTO', 'Evento 138 actualizado.', '2026-03-25 22:06:47'),
(396, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 138. Equipos requeridos: Camara de alta velocidad .', '2026-03-25 22:06:47'),
(397, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-25 22:08:03'),
(398, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 140 ha pasado al estado: \"Aprobado\".', '2026-03-25 22:08:21'),
(399, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-25 22:09:18'),
(400, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 138 pasaron al estado: \"Aprobado\".', '2026-03-25 22:09:50'),
(401, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-25 22:10:45'),
(402, 22, 3, 'EDICION_EVENTO', 'Evento 135 actualizado.', '2026-03-25 22:16:14'),
(403, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 135 ha pasado al estado: \"Aprobado\".', '2026-03-25 22:17:42'),
(404, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 134 ha pasado al estado: \"Aprobado\".', '2026-03-25 22:17:48'),
(405, 22, 3, 'AUTO_FINALIZACION_EVENTO', 'El evento \"pruebas sistema \" (ID: 134) fue finalizado automáticamente al superar su fecha de fin.', '2026-03-25 23:14:26'),
(406, 22, 3, 'AUTO_FINALIZACION_EVENTO', 'El evento \"chalas\" (ID: 135) fue finalizado automáticamente al superar su fecha de fin.', '2026-03-25 23:14:26'),
(407, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-26 20:40:54'),
(408, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-26 20:45:41'),
(409, 1, 1, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 141. Título: \"Test Event Conflict\".', '2026-03-26 20:52:23'),
(410, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-26 21:10:39'),
(411, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-26 21:11:21'),
(412, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-26 21:15:32'),
(413, 22, 3, 'EDICION_EVENTO', 'Evento 135 actualizado. Presupuesto nuevo: 40000 DOP.', '2026-03-26 21:17:28'),
(414, 22, 3, 'EDICION_EVENTO', 'Evento 134 actualizado. Presupuesto nuevo: 40000 USD.', '2026-03-26 21:19:33'),
(415, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-26 21:33:32'),
(416, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-27 22:07:15'),
(417, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-27 22:07:31'),
(418, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-27 22:11:04'),
(419, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-27 22:13:16'),
(420, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 8 cambiado a Rechazado.', '2026-03-27 22:13:56'),
(421, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 7 cambiado a Rechazado.', '2026-03-27 22:14:18'),
(422, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 5 cambiado a Aprobado.', '2026-03-27 22:14:27'),
(423, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Finalizado\".', '2026-03-27 22:15:32'),
(424, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 138 ha pasado al estado: \"Finalizado\".', '2026-03-27 22:15:40'),
(425, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 141 ha pasado al estado: \"Finalizado\".', '2026-03-27 22:15:47'),
(426, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-27 22:40:03'),
(427, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 142. Título: \"Prueba 4\".', '2026-03-27 22:50:06'),
(428, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-27 22:57:58'),
(429, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 143. Título: \"Pruba 4\".', '2026-03-27 23:02:58'),
(430, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 144. Título: \"Pruba 4\".', '2026-03-27 23:03:47'),
(431, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 144. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación.', '2026-03-27 23:03:47'),
(432, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 144 ha pasado al estado: \"Aprobado\".', '2026-03-27 23:06:36'),
(433, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-27 23:07:03'),
(434, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-27 23:07:16'),
(435, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 144 pasaron al estado: \"Aprobado\".', '2026-03-27 23:07:55'),
(436, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 11 cambiado a Aprobado.', '2026-03-27 23:09:19'),
(437, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 11 cambiado a Rechazado.', '2026-03-27 23:09:47'),
(438, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 11 cambiado a Aprobado.', '2026-03-27 23:10:39'),
(439, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-27 23:11:59'),
(440, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 144 ha pasado al estado: \"Finalizado\".', '2026-03-27 23:12:15'),
(441, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Aprobado\".', '2026-03-27 23:13:22'),
(442, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 139 ha pasado al estado: \"Finalizado\".', '2026-03-27 23:14:04'),
(443, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 143 ha pasado al estado: \"Finalizado\".', '2026-03-27 23:18:45'),
(444, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 142 ha pasado al estado: \"Aprobado\".', '2026-03-27 23:20:10'),
(445, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 142 ha pasado al estado: \"Finalizado\".', '2026-03-27 23:20:19'),
(446, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 9 cambiado a Aprobado.', '2026-03-27 23:20:45'),
(447, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-27 23:21:23'),
(448, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 145. Título: \"Prueba 4 \".', '2026-03-27 23:44:27'),
(449, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 146. Título: \"Prueba 4 \".', '2026-03-27 23:45:14'),
(450, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 147. Título: \"Prueba 4 \".', '2026-03-27 23:45:47'),
(451, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 147. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación.', '2026-03-27 23:45:47'),
(452, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 147 ha pasado al estado: \"Aprobado\".', '2026-03-27 23:47:38'),
(453, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-27 23:48:51'),
(454, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 147 pasaron al estado: \"Aprobado\".', '2026-03-27 23:49:38'),
(455, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 14 cambiado a Aprobado.', '2026-03-27 23:53:08'),
(456, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 14 cambiado a Rechazado.', '2026-03-27 23:53:30'),
(457, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 14 cambiado a Aprobado.', '2026-03-27 23:54:32'),
(458, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-27 23:55:20'),
(459, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 147 ha pasado al estado: \"Finalizado\".', '2026-03-27 23:55:35'),
(460, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-27 23:56:14'),
(461, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 6. Evento ID: 147. Recinto: Santiago. Valoración: Excelente. Satisfacción: 4/5.', '2026-03-27 23:56:59'),
(462, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-29 16:34:26'),
(463, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-29 16:36:00'),
(464, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-29 16:43:49'),
(465, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-29 16:44:23'),
(466, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-29 16:45:18'),
(467, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-29 16:46:57'),
(468, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-29 16:47:15'),
(469, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-29 16:47:31'),
(470, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-29 17:03:55'),
(471, 24, 5, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como manuel (100041111@p.uapa.edu.do) bajo el rol de Administrador de Evento.', '2026-03-29 17:04:03'),
(472, 23, 4, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Ismael Cruz  (100042222@p.uapa.edu.do) bajo el rol de Administrador de Audiovisual.', '2026-03-29 17:04:31'),
(473, 25, 7, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como David  (100045555@p.uapa.edu.do) bajo el rol de Administrador V-A-F.', '2026-03-29 17:05:01'),
(474, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-29 17:08:29'),
(475, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 148. Título: \"Prueba 5\".', '2026-03-29 17:12:47'),
(476, 22, 3, 'CREACION_EVENTO', 'Nueva Solicitud de Evento. ID generado: 149. Título: \"Prueba 5\".', '2026-03-29 17:14:36'),
(477, 22, 3, 'CREACION_AUDIOVISUAL', 'Se levantó una Solicitud de Servicios Audiovisuales. Evento Asociado ID: 149. Equipos requeridos: Camara de alta velocidad , Cámaras (Grabación), Iluminación, Micrófonos.', '2026-03-29 17:14:36'),
(478, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 149 ha pasado al estado: \"Aprobado\".', '2026-03-29 17:16:51'),
(479, 23, 4, 'ACTUALIZACION_AUDIOVISUAL_GLOBAL', 'Resolución Global de Audiovisual. Los servicios del Evento ID 149 pasaron al estado: \"Aprobado\".', '2026-03-29 17:17:55'),
(480, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 16 cambiado a Aprobado.', '2026-03-29 17:20:23'),
(481, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 16 cambiado a Rechazado.', '2026-03-29 17:20:45'),
(482, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 16 cambiado a Aprobado.', '2026-03-29 17:22:21'),
(483, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 15 cambiado a Aprobado.', '2026-03-29 17:22:36'),
(484, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 8 cambiado a Aprobado.', '2026-03-29 17:22:56'),
(485, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 8 cambiado a Rechazado.', '2026-03-29 17:23:22'),
(486, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 16 cambiado a Rechazado.', '2026-03-29 17:23:38'),
(487, 25, 7, 'ACTUALIZACION_POA', 'Movimiento 16 cambiado a Aprobado.', '2026-03-29 17:23:43'),
(488, 24, 5, 'ACTUALIZACION_EVENTO', 'Resolución de Estado del Evento. El Evento con ID 149 ha pasado al estado: \"Finalizado\".', '2026-03-29 17:25:01'),
(489, 22, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Victor Diaz (Father021967@gmail.com) bajo el rol de Solicitante.', '2026-03-29 17:26:04'),
(490, 22, 3, 'CREACION_EVALUACION', 'Nueva evaluación registrada. ID: 7. Evento ID: 149. Recinto: Santiago. Valoración: Excelente. Satisfacción: 5/5.', '2026-03-29 17:26:45'),
(491, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-29 17:27:20'),
(492, 18, 1, 'CREACION_USUARIO', 'Registro de nuevo usuario. ID asignado: 26, Nombre: juana rosario, Correo: 100048888@p.uapa.edu.do, Nivel de Rol ID: 3.', '2026-03-29 17:30:19'),
(493, 26, 3, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como juana rosario (100048888@p.uapa.edu.do) bajo el rol de Solicitante.', '2026-03-29 17:30:54'),
(494, 18, 1, 'LOGIN', 'Sesión Inicada (Manual). Autenticado como Rubel  (rubelmanuelc@gmail.com) bajo el rol de Administrador.', '2026-03-30 20:18:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dependencia`
--

CREATE TABLE `dependencia` (
  `id_dependencia` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `responsable` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `dependencia`
--

INSERT INTO `dependencia` (`id_dependencia`, `nombre`, `responsable`) VALUES
(1, 'Ceges', NULL),
(2, 'Rectoría', NULL),
(3, 'Centro de apoyo', NULL),
(4, 'Asesoría legal', NULL),
(5, 'Dirección de tecnología informática', NULL),
(6, 'Secretaría general', NULL),
(7, 'Archivo central', NULL),
(8, 'Registro', NULL),
(9, 'Vicerrectoría académica', NULL),
(10, 'Dirección académica', NULL),
(11, 'Servicio al participante y vida universitaria', NULL),
(12, 'Evaluación de los aprendizajes', NULL),
(13, 'Menciones tecnopedagógicas', NULL),
(14, 'Práctica profesional y servicio social', NULL),
(15, 'Dirección académica de recintos', NULL),
(16, 'Vicerrectoría de investigación y posgrado', NULL),
(17, 'Investigación divulgación científica', NULL),
(18, 'Investigación formativa', NULL),
(19, 'Dirección de programa de posgrado', NULL),
(20, 'Biblioteca', NULL),
(21, 'Vicerrectorías administrativa y financiera', NULL),
(22, 'Dirección administrativa', NULL),
(23, 'Dirección financiera', NULL),
(24, 'Gestión humana', NULL),
(25, 'Publicaciones', NULL),
(26, 'Cap', NULL),
(27, 'Cude', NULL),
(28, 'Vicerrectoría de planificación innovación y desarrollo', NULL),
(29, 'Aseguración de la calidad', NULL),
(30, 'Planificación y control', NULL),
(31, 'Innovación', NULL),
(32, 'Vicerrectoría de vinculación y comunicación', NULL),
(33, 'Relaciones institucionales e interinstitucionales', NULL),
(34, 'Dirección de vinculación y extensión', NULL),
(35, 'Extensión voluntariado', NULL),
(36, 'Admisiones', NULL),
(37, 'Protocolo y eventos', NULL),
(38, 'Relaciones públicas', NULL),
(39, 'Captación de nuevos participantes', NULL),
(40, 'Coopfre UAPA', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_corporativo`
--

CREATE TABLE `detalle_corporativo` (
  `id_detalle_corporativo` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `tipo` enum('Bultos','T-shirt','Editoriales UAPA','Lapiceros','Llaveros','Vasos','Libreta','Otros','No aplica') NOT NULL,
  `descripcion_otro` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_corporativo`
--

INSERT INTO `detalle_corporativo` (`id_detalle_corporativo`, `id_evento`, `tipo`, `descripcion_otro`) VALUES
(24, 138, 'No aplica', NULL),
(29, 145, 'Otros', NULL),
(30, 146, 'Otros', NULL),
(31, 147, 'Otros', NULL),
(32, 148, 'No aplica', NULL),
(33, 149, 'No aplica', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_montaje`
--

CREATE TABLE `detalle_montaje` (
  `id_detalle_montaje` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `descripcion` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_montaje`
--

INSERT INTO `detalle_montaje` (`id_detalle_montaje`, `id_evento`, `descripcion`) VALUES
(18, 136, 'prueba sistema'),
(24, 139, 'Pruebas de video'),
(26, 138, 'Pruebas de video'),
(29, 135, 'probar ver detalles '),
(30, 134, 'prueba '),
(34, 145, 'Prueba 4'),
(35, 146, 'Prueba 4'),
(36, 147, 'Prueba 4'),
(37, 148, 'Prueba 5'),
(38, 149, 'Prueba 5');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_presupuesto`
--

CREATE TABLE `detalle_presupuesto` (
  `id_detalle` int(11) NOT NULL,
  `id_presupuesto` int(11) NOT NULL,
  `concepto` varchar(150) DEFAULT NULL,
  `proveedor` varchar(150) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precio_unitario` decimal(12,2) DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipo_audiovisual`
--

CREATE TABLE `equipo_audiovisual` (
  `id_equipo` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `icono` varchar(50) DEFAULT 'FiMonitor',
  `cantidad_total` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `equipo_audiovisual`
--

INSERT INTO `equipo_audiovisual` (`id_equipo`, `nombre`, `icono`, `cantidad_total`) VALUES
(1, 'Proyector', 'FiMonitor', 30),
(2, 'Sistema de sonido', 'FiSpeaker', 20),
(3, 'Micrófonos', 'FiMic', 30),
(4, 'Cámaras (Grabación)', 'FiVideo', 20),
(5, 'Transmisión en vivo', 'FiRadio', 20),
(6, 'Iluminación', 'FiSun', 20),
(7, 'Pantallas o monitores extras', 'FiCast', 20),
(8, 'Camara de alta velocidad ', 'FiVideo', 30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluacion`
--

CREATE TABLE `evaluacion` (
  `id_evaluacion` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `respuesta_solicitud` enum('Si','No') DEFAULT NULL,
  `recinto` enum('Cibao Oriental','Nagua','Santo Domingo Oriental','Santiago') DEFAULT NULL,
  `valoracion_respuesta` enum('Muy eficiente','Excelente','Eficiente','Deficiente') DEFAULT NULL,
  `satisfaccion` int(11) DEFAULT NULL CHECK (`satisfaccion` between 1 and 5),
  `comentario` text DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evaluacion`
--

INSERT INTO `evaluacion` (`id_evaluacion`, `id_evento`, `respuesta_solicitud`, `recinto`, `valoracion_respuesta`, `satisfaccion`, `comentario`, `fecha`) VALUES
(2, 136, 'Si', 'Santiago', 'Excelente', 4, 'muy buena experiencia ', '2026-03-21 19:01:18'),
(3, 135, 'Si', 'Santiago', 'Excelente', 5, 'prueba satifatoria ', '2026-03-22 14:07:53'),
(5, 139, 'Si', 'Santiago', 'Muy eficiente', 4, 'Prueba de evento', '2026-03-22 14:40:32'),
(6, 147, 'Si', 'Santiago', 'Excelente', 4, 'Pruebas video 4', '2026-03-27 23:56:59'),
(7, 149, 'Si', 'Santiago', 'Excelente', 5, 'Prueba 5 bien', '2026-03-29 17:26:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evento`
--

CREATE TABLE `evento` (
  `id_evento` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `modalidad` enum('Virtual','Presencial','Hibrido') NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `cantidad_asistentes` int(11) NOT NULL,
  `tipo_evento` varchar(100) NOT NULL,
  `monto_poa` decimal(15,2) DEFAULT NULL,
  `moneda` enum('USD','EUR','DOP') DEFAULT NULL,
  `estado` enum('Pendiente','Aprobado','Rechazado','Finalizado') DEFAULT 'Pendiente',
  `id_usuario` int(11) NOT NULL,
  `id_dependencia` int(11) NOT NULL,
  `id_recinto` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evento`
--

INSERT INTO `evento` (`id_evento`, `nombre`, `modalidad`, `fecha_inicio`, `fecha_fin`, `hora_inicio`, `hora_fin`, `cantidad_asistentes`, `tipo_evento`, `monto_poa`, `moneda`, `estado`, `id_usuario`, `id_dependencia`, `id_recinto`, `fecha_creacion`) VALUES
(134, 'pruebas sistema ', 'Presencial', '2026-04-06', '2026-04-06', '12:02:00', '17:48:00', 200, 'Curso taller práctico', 40000.00, 'USD', 'Finalizado', 22, 3, 1, '2026-03-21 14:04:23'),
(135, 'chalas', 'Presencial', '2026-04-09', '2026-04-09', '14:54:00', '17:40:00', 2000, 'Congreso internacional', 40000.00, 'DOP', 'Finalizado', 22, 14, 1, '2026-03-21 15:02:12'),
(136, 'reunion de sistema ', 'Presencial', '2026-03-21', '2026-03-21', '12:48:00', '17:59:00', 20, 'Firma de convenio', 40000.00, 'USD', 'Finalizado', 22, 11, 1, '2026-03-21 17:50:29'),
(138, 'Pruebas de video', 'Presencial', '2026-03-30', '2026-03-30', '11:26:00', '16:24:00', 200, 'Curso taller práctico', 10000.00, 'DOP', 'Finalizado', 22, 11, 1, '2026-03-22 14:27:11'),
(139, 'Pruebas de video', 'Presencial', '2026-03-27', '2026-03-27', '11:26:00', '16:24:00', 200, 'Curso taller práctico', 10000.00, 'DOP', 'Finalizado', 22, 11, 1, '2026-03-22 14:28:07'),
(145, 'Prueba 4 ', 'Virtual', '2026-03-28', '2026-03-28', '06:42:00', '16:42:00', 200, 'Firma de convenio', 10000.00, 'DOP', 'Pendiente', 22, 5, 1, '2026-03-27 23:44:27'),
(146, 'Prueba 4 ', 'Virtual', '2026-03-29', '2026-03-29', '06:42:00', '16:42:00', 200, 'Firma de convenio', 10000.00, 'DOP', 'Pendiente', 22, 5, 1, '2026-03-27 23:45:14'),
(147, 'Prueba 4 ', 'Virtual', '2026-04-02', '2026-04-02', '06:42:00', '16:42:00', 200, 'Firma de convenio', 10000.00, 'DOP', 'Finalizado', 22, 5, 1, '2026-03-27 23:45:47'),
(148, 'Prueba 5', 'Hibrido', '2026-03-31', '2026-03-31', '12:10:00', '17:10:00', 200, 'Curso taller práctico', 20000.00, 'DOP', 'Pendiente', 22, 12, 1, '2026-03-29 17:12:47'),
(149, 'Prueba 5', 'Hibrido', '2026-04-03', '2026-04-03', '12:10:00', '17:10:00', 200, 'Curso taller práctico', 20000.00, 'DOP', 'Finalizado', 22, 12, 1, '2026-03-29 17:14:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evento_alimento`
--

CREATE TABLE `evento_alimento` (
  `id_evento` int(11) NOT NULL,
  `id_alimento` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evento_alimento`
--

INSERT INTO `evento_alimento` (`id_evento`, `id_alimento`) VALUES
(136, 2),
(138, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poa_fiscal`
--

CREATE TABLE `poa_fiscal` (
  `id_poa` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `monto_total` decimal(15,2) NOT NULL,
  `monto_disponible` decimal(15,2) NOT NULL,
  `creado_por` int(11) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `poa_fiscal`
--

INSERT INTO `poa_fiscal` (`id_poa`, `fecha_inicio`, `fecha_fin`, `monto_total`, `monto_disponible`, `creado_por`, `fecha_creacion`) VALUES
(2, '2026-03-01', '2027-02-28', 4000000.07, 2669686.13, 25, '2026-03-21 17:34:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poa_movimiento`
--

CREATE TABLE `poa_movimiento` (
  `id_movimiento` int(11) NOT NULL,
  `id_poa` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `monto_solicitado_original` decimal(15,2) NOT NULL,
  `moneda_original` varchar(10) NOT NULL,
  `tasa_cambio` decimal(10,4) NOT NULL,
  `monto_descontado_dop` decimal(15,2) NOT NULL,
  `estado` enum('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
  `motivo_rechazo` text DEFAULT NULL,
  `fecha_movimiento` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `poa_movimiento`
--

INSERT INTO `poa_movimiento` (`id_movimiento`, `id_poa`, `id_evento`, `monto_solicitado_original`, `moneda_original`, `tasa_cambio`, `monto_descontado_dop`, `estado`, `motivo_rechazo`, `fecha_movimiento`) VALUES
(3, 2, 136, 40000.00, 'USD', 60.5069, 2420276.88, 'Rechazado', 'no pruebas ', '2026-03-21 17:50:29'),
(5, 2, 138, 10000.00, 'DOP', 1.0000, 10000.00, 'Aprobado', NULL, '2026-03-22 14:27:11'),
(6, 2, 139, 10000.00, 'DOP', 1.0000, 10000.00, 'Aprobado', NULL, '2026-03-22 14:28:07'),
(7, 2, 135, 40000.00, 'DOP', 1.0000, 40000.00, 'Rechazado', 'pruebas hecha', '2026-03-26 21:17:28'),
(8, 2, 134, 40000.00, 'USD', 60.4622, 2418489.88, 'Rechazado', 'no aplica', '2026-03-26 21:19:33'),
(12, 2, 145, 10000.00, 'DOP', 1.0000, 10000.00, 'Pendiente', NULL, '2026-03-27 23:44:27'),
(13, 2, 146, 10000.00, 'DOP', 1.0000, 10000.00, 'Pendiente', NULL, '2026-03-27 23:45:14'),
(14, 2, 147, 10000.00, 'DOP', 1.0000, 10000.00, 'Aprobado', NULL, '2026-03-27 23:45:47'),
(15, 2, 148, 20000.00, 'DOP', 1.0000, 20000.00, 'Aprobado', NULL, '2026-03-29 17:12:47'),
(16, 2, 149, 20000.00, 'DOP', 1.0000, 20000.00, 'Aprobado', NULL, '2026-03-29 17:14:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuesto`
--

CREATE TABLE `presupuesto` (
  `id_presupuesto` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `total` decimal(15,2) NOT NULL,
  `estado` enum('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recinto`
--

CREATE TABLE `recinto` (
  `id_recinto` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recinto`
--

INSERT INTO `recinto` (`id_recinto`, `nombre`) VALUES
(1, 'Sede Santiago'),
(2, 'Santo Domingo Oriental'),
(3, 'Sibao Oriental Nagua'),
(4, 'Europa'),
(5, 'Estados Unidos'),
(6, 'Neyba'),
(7, 'San Juan'),
(8, 'Higüey'),
(9, 'Pedernales');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `restablecimiento_token`
--

CREATE TABLE `restablecimiento_token` (
  `id_token` int(11) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiracion` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `restablecimiento_token`
--

INSERT INTO `restablecimiento_token` (`id_token`, `correo`, `token`, `expiracion`) VALUES
(3, '202105774@uapa.edu.do', '95667deb46302e73e5334522dd67d0d36a36c4d6ae2fe5291083e21c426fb721', '2026-03-14 21:02:56'),
(4, '202105774@uapa.edu.do', 'fbe41f04e87e409968f7406ec02fe63f60a975c4a9ab4b596515e6f3f169c95a', '2026-03-14 21:06:08'),
(10, '202105774@uapa.edu.do', '951dbceac11ddc3bdadecf9d0e9231021fdd6383d48fb3a79216dcee0291e6d5', '2026-03-15 00:25:39'),
(11, '202105774@p.uapa.edu.do', '478db01e231009b16615e07942336c69e3070d3960816e657a7487260b8245d6', '2026-03-15 00:29:46'),
(12, '202105774@p.uapa.edu.do', 'ab178c8f806d894ac2570035a0353cbc5badcb081635b28d3a4ae6b0c31d897b', '2026-03-15 00:30:28'),
(13, '202105774@p.uapa.edu.do', '942e4e51085b252b58f0a8d50332a2f811b9942c79f2244d3890f52894b1c708', '2026-03-15 00:31:03'),
(14, '202105774@p.uapa.edu.do', '0a55cd280a9ed6447c78f9373f1e2d0fe1ad7e4437ab6e2f15323b1779f4da71', '2026-03-15 00:32:55'),
(16, '202105774@p.uapa.edu.do', '955333e650d0a498a1f7271044f028652e13bdea67230965ac6889a69a8a0f37', '2026-03-15 00:43:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id_rol`, `nombre`) VALUES
(1, 'Administrador'),
(4, 'Administrador de Audiovisual'),
(5, 'Administrador de Evento'),
(7, 'Administrador V-A-F'),
(2, 'Desarrollador'),
(3, 'Solicitante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_audiovisual`
--

CREATE TABLE `servicio_audiovisual` (
  `id_servicio` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `tipo_servicio` varchar(150) NOT NULL,
  `estado` enum('Pendiente','Aprobado','Rechazado') DEFAULT 'Pendiente',
  `cantidad` int(11) DEFAULT 1,
  `ubicacion` varchar(255) DEFAULT '',
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicio_audiovisual`
--

INSERT INTO `servicio_audiovisual` (`id_servicio`, `id_evento`, `tipo_servicio`, `estado`, `cantidad`, `ubicacion`, `observaciones`) VALUES
(50, 139, 'Camara de alta velocidad ', 'Aprobado', 1, '', 'Pruebas de video'),
(51, 139, 'Cámaras (Grabación)', 'Aprobado', 5, '', 'Pruebas de video'),
(52, 139, 'Iluminación', 'Aprobado', 3, '', 'Pruebas de video'),
(53, 138, 'Camara de alta velocidad ', 'Aprobado', 4, '', ''),
(57, 147, 'Camara de alta velocidad ', 'Aprobado', 4, '', ''),
(58, 147, 'Cámaras (Grabación)', 'Aprobado', 5, '', ''),
(59, 147, 'Iluminación', 'Aprobado', 4, '', ''),
(60, 149, 'Camara de alta velocidad ', 'Aprobado', 4, '', ''),
(61, 149, 'Cámaras (Grabación)', 'Aprobado', 4, '', ''),
(62, 149, 'Iluminación', 'Aprobado', 4, '', ''),
(63, 149, 'Micrófonos', 'Aprobado', 3, '', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_detalle_corporativo`
--

CREATE TABLE `tipo_detalle_corporativo` (
  `id_detalle_corp` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_detalle_corporativo`
--

INSERT INTO `tipo_detalle_corporativo` (`id_detalle_corp`, `nombre`) VALUES
(1, 'Bultos, T-shert'),
(2, 'Editoriales UAPA (libros)'),
(3, 'Lapiceros'),
(6, 'Libreta'),
(4, 'Llaveros'),
(8, 'No aplica'),
(7, 'Otros'),
(5, 'Vasos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_evento_master`
--

CREATE TABLE `tipo_evento_master` (
  `id_tipo_evento` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_evento_master`
--

INSERT INTO `tipo_evento_master` (`id_tipo_evento`, `nombre`) VALUES
(7, 'Conferencia magistral'),
(6, 'Congreso internacional'),
(2, 'Curso taller práctico'),
(8, 'Evento curso cultural'),
(10, 'Feria universitaria'),
(4, 'Firma de convenio'),
(9, 'Jornada de investigación'),
(1, 'Reunión'),
(13, 'Reunión de cuentas'),
(5, 'Seminario académico'),
(14, 'Visitas guiada de colegio');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `token_acceso_rapido` varchar(255) DEFAULT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `nombre`, `correo`, `contrasena`, `id_rol`, `estado`, `token_acceso_rapido`, `ultimo_login`, `fecha_creacion`) VALUES
(1, 'Administrador', '100049725@p.uapa.edu.do', '12345678', 1, 'activo', NULL, NULL, '2026-03-07 15:29:14'),
(12, 'Rubel ', '1000468@uapa.edu.do', 'admin123', 1, 'activo', NULL, NULL, '2026-03-13 21:55:10'),
(18, 'Rubel ', 'rubelmanuelc@gmail.com', '123456789', 1, 'activo', NULL, NULL, '2026-03-15 12:15:17'),
(22, 'Victor Diaz', 'Father021967@gmail.com', '12345678', 3, 'activo', NULL, NULL, '2026-03-15 16:16:12'),
(23, 'Ismael Cruz ', '100042222@p.uapa.edu.do', '12345678', 4, 'activo', NULL, NULL, '2026-03-17 01:21:30'),
(24, 'manuel', '100041111@p.uapa.edu.do', '12345678', 5, 'activo', NULL, NULL, '2026-03-17 01:24:09'),
(25, 'David ', '100045555@p.uapa.edu.do', '12345678', 7, 'activo', NULL, NULL, '2026-03-21 13:24:44'),
(26, 'juana rosario', '100048888@p.uapa.edu.do', '12345678', 3, 'activo', NULL, NULL, '2026-03-29 17:30:19');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alimento`
--
ALTER TABLE `alimento`
  ADD PRIMARY KEY (`id_alimento`);

--
-- Indices de la tabla `bitacora_movimiento`
--
ALTER TABLE `bitacora_movimiento`
  ADD PRIMARY KEY (`id_bitacora`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_rol` (`id_rol`);

--
-- Indices de la tabla `dependencia`
--
ALTER TABLE `dependencia`
  ADD PRIMARY KEY (`id_dependencia`);

--
-- Indices de la tabla `detalle_corporativo`
--
ALTER TABLE `detalle_corporativo`
  ADD PRIMARY KEY (`id_detalle_corporativo`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `detalle_montaje`
--
ALTER TABLE `detalle_montaje`
  ADD PRIMARY KEY (`id_detalle_montaje`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `detalle_presupuesto`
--
ALTER TABLE `detalle_presupuesto`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_presupuesto` (`id_presupuesto`);

--
-- Indices de la tabla `equipo_audiovisual`
--
ALTER TABLE `equipo_audiovisual`
  ADD PRIMARY KEY (`id_equipo`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `evaluacion`
--
ALTER TABLE `evaluacion`
  ADD PRIMARY KEY (`id_evaluacion`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `evento`
--
ALTER TABLE `evento`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_dependencia` (`id_dependencia`),
  ADD KEY `id_recinto` (`id_recinto`);

--
-- Indices de la tabla `evento_alimento`
--
ALTER TABLE `evento_alimento`
  ADD PRIMARY KEY (`id_evento`,`id_alimento`),
  ADD KEY `evento_alimento_ibfk_2` (`id_alimento`);

--
-- Indices de la tabla `poa_fiscal`
--
ALTER TABLE `poa_fiscal`
  ADD PRIMARY KEY (`id_poa`),
  ADD KEY `creado_por` (`creado_por`);

--
-- Indices de la tabla `poa_movimiento`
--
ALTER TABLE `poa_movimiento`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `id_poa` (`id_poa`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  ADD PRIMARY KEY (`id_presupuesto`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `recinto`
--
ALTER TABLE `recinto`
  ADD PRIMARY KEY (`id_recinto`);

--
-- Indices de la tabla `restablecimiento_token`
--
ALTER TABLE `restablecimiento_token`
  ADD PRIMARY KEY (`id_token`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `servicio_audiovisual`
--
ALTER TABLE `servicio_audiovisual`
  ADD PRIMARY KEY (`id_servicio`),
  ADD KEY `id_evento` (`id_evento`);

--
-- Indices de la tabla `tipo_detalle_corporativo`
--
ALTER TABLE `tipo_detalle_corporativo`
  ADD PRIMARY KEY (`id_detalle_corp`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tipo_evento_master`
--
ALTER TABLE `tipo_evento_master`
  ADD PRIMARY KEY (`id_tipo_evento`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alimento`
--
ALTER TABLE `alimento`
  MODIFY `id_alimento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `bitacora_movimiento`
--
ALTER TABLE `bitacora_movimiento`
  MODIFY `id_bitacora` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=495;

--
-- AUTO_INCREMENT de la tabla `dependencia`
--
ALTER TABLE `dependencia`
  MODIFY `id_dependencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `detalle_corporativo`
--
ALTER TABLE `detalle_corporativo`
  MODIFY `id_detalle_corporativo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `detalle_montaje`
--
ALTER TABLE `detalle_montaje`
  MODIFY `id_detalle_montaje` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `detalle_presupuesto`
--
ALTER TABLE `detalle_presupuesto`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `equipo_audiovisual`
--
ALTER TABLE `equipo_audiovisual`
  MODIFY `id_equipo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `evaluacion`
--
ALTER TABLE `evaluacion`
  MODIFY `id_evaluacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `evento`
--
ALTER TABLE `evento`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=150;

--
-- AUTO_INCREMENT de la tabla `poa_fiscal`
--
ALTER TABLE `poa_fiscal`
  MODIFY `id_poa` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `poa_movimiento`
--
ALTER TABLE `poa_movimiento`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  MODIFY `id_presupuesto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recinto`
--
ALTER TABLE `recinto`
  MODIFY `id_recinto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `restablecimiento_token`
--
ALTER TABLE `restablecimiento_token`
  MODIFY `id_token` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `servicio_audiovisual`
--
ALTER TABLE `servicio_audiovisual`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de la tabla `tipo_detalle_corporativo`
--
ALTER TABLE `tipo_detalle_corporativo`
  MODIFY `id_detalle_corp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `tipo_evento_master`
--
ALTER TABLE `tipo_evento_master`
  MODIFY `id_tipo_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bitacora_movimiento`
--
ALTER TABLE `bitacora_movimiento`
  ADD CONSTRAINT `bitacora_movimiento_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  ADD CONSTRAINT `bitacora_movimiento_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`);

--
-- Filtros para la tabla `detalle_corporativo`
--
ALTER TABLE `detalle_corporativo`
  ADD CONSTRAINT `detalle_corporativo_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalle_montaje`
--
ALTER TABLE `detalle_montaje`
  ADD CONSTRAINT `detalle_montaje_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `detalle_presupuesto`
--
ALTER TABLE `detalle_presupuesto`
  ADD CONSTRAINT `detalle_presupuesto_ibfk_1` FOREIGN KEY (`id_presupuesto`) REFERENCES `presupuesto` (`id_presupuesto`) ON DELETE CASCADE;

--
-- Filtros para la tabla `evaluacion`
--
ALTER TABLE `evaluacion`
  ADD CONSTRAINT `evaluacion_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `evento`
--
ALTER TABLE `evento`
  ADD CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  ADD CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`id_dependencia`) REFERENCES `dependencia` (`id_dependencia`),
  ADD CONSTRAINT `evento_ibfk_3` FOREIGN KEY (`id_recinto`) REFERENCES `recinto` (`id_recinto`);

--
-- Filtros para la tabla `evento_alimento`
--
ALTER TABLE `evento_alimento`
  ADD CONSTRAINT `evento_alimento_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE,
  ADD CONSTRAINT `evento_alimento_ibfk_2` FOREIGN KEY (`id_alimento`) REFERENCES `alimento` (`id_alimento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `poa_fiscal`
--
ALTER TABLE `poa_fiscal`
  ADD CONSTRAINT `poa_fiscal_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `poa_movimiento`
--
ALTER TABLE `poa_movimiento`
  ADD CONSTRAINT `poa_movimiento_ibfk_1` FOREIGN KEY (`id_poa`) REFERENCES `poa_fiscal` (`id_poa`) ON DELETE CASCADE,
  ADD CONSTRAINT `poa_movimiento_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `presupuesto`
--
ALTER TABLE `presupuesto`
  ADD CONSTRAINT `presupuesto_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_audiovisual`
--
ALTER TABLE `servicio_audiovisual`
  ADD CONSTRAINT `servicio_audiovisual_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
