CREATE TABLE `products` (
  `productID` int(11) NOT NULL AUTO_INCREMENT,
  `visproductID` int(11) DEFAULT NULL,
  `productname` varchar(150) NOT NULL,
  `departmentname` varchar(100) NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `stockqty` int(11) NOT NULL,
  `backorder` int(11) DEFAULT NULL,
  `productsales` int(11) DEFAULT NULL,
  PRIMARY KEY (`productID`),
  UNIQUE KEY `productID_UNIQUE` (`productID`),
  UNIQUE KEY `productname_UNIQUE` (`productname`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

