CREATE TABLE `departments` (
  `departmentID` int(11) NOT NULL AUTO_INCREMENT,
  `departmentname` varchar(45) NOT NULL,
  `overheadcosts` int(11) NOT NULL,
  PRIMARY KEY (`departmentID`),
  UNIQUE KEY `departmentID_UNIQUE` (`departmentID`),
  UNIQUE KEY `departmentname_UNIQUE` (`departmentname`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
