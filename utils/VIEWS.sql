-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 08, 2026 at 10:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `motorpartshub`
--

-- --------------------------------------------------------

--
-- Stand-in structure for view `orderdetails`
-- (See below for the actual view)
--
CREATE TABLE `orderdetails` (
`orderinfo_id` int(11)
,`lname` varchar(45)
,`fname` varchar(32)
,`addressline` varchar(45)
,`town` varchar(45)
,`zipcode` varchar(15)
,`phone` varchar(45)
,`status` varchar(40)
,`name` varchar(255)
,`quantity` smallint(6)
,`sell_price` float
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `salesperorder`
-- (See below for the actual view)
--
CREATE TABLE `salesperorder` (
`orderinfo_id` int(11)
,`total` double
,`status` varchar(40)
);

-- --------------------------------------------------------

--
-- Structure for view `orderdetails`
--
DROP TABLE IF EXISTS `orderdetails`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `orderdetails`  AS SELECT `o`.`orderinfo_id` AS `orderinfo_id`, `c`.`lname` AS `lname`, `c`.`fname` AS `fname`, `c`.`addressline` AS `addressline`, `c`.`town` AS `town`, `c`.`zipcode` AS `zipcode`, `c`.`phone` AS `phone`, concat(ucase(left(`o`.`status`,1)),substr(`o`.`status`,2)) AS `status`, `it`.`name` AS `name`, `ol`.`quantity` AS `quantity`, `it`.`sell_price` AS `sell_price` FROM (((`orderinfo` `o` join `customers` `c` on(`o`.`customer_id` = `c`.`customer_id`)) join `orderline` `ol` on(`o`.`orderinfo_id` = `ol`.`orderinfo_id`)) join `items` `it` on(`ol`.`item_id` = `it`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `salesperorder`
--
DROP TABLE IF EXISTS `salesperorder`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `salesperorder`  AS SELECT `o`.`orderinfo_id` AS `orderinfo_id`, sum(`it`.`sell_price` * `ol`.`quantity`) AS `total`, concat(ucase(left(`o`.`status`,1)),substr(`o`.`status`,2)) AS `status` FROM ((`orderinfo` `o` join `orderline` `ol` on(`o`.`orderinfo_id` = `ol`.`orderinfo_id`)) join `items` `it` on(`ol`.`item_id` = `it`.`id`)) GROUP BY `o`.`orderinfo_id`, `o`.`status` ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
