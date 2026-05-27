<?php

$conexion = new mysqli("localhost", "root", "", "login_web");

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

echo "Conexión exitosa a la base de datos";

?>