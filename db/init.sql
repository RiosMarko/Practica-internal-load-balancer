CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  user VARCHAR(50) NOT NULL,
  password VARCHAR(50) NOT NULL
);

INSERT INTO usuarios (nombre, status, user, password) VALUES
('Marco Rios', 'activo', 'mrios', 'pass123'),
('Jose Perez', 'activo', 'jperez', 'pass456'),
('Ana Lopez', 'inactivo', 'alopez', 'pass789'),
('Carlos Torres', 'activo', 'ctorres', 'pass321'),
('Luis Garcia', 'activo', 'lgarcia', 'pass654');
