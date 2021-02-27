<?php
require_once('plugins/login-servers.php');
$driver = "pgsql";

/** Set supported servers
  * @param array array($description => array("server" => , "driver" => "server|pgsql|sqlite|..."))
*/
return new AdminerLoginServers(
    $servers = array(
        "db" => array("server" => "db", "driver" => $driver),
        "db_kone" => array("server" => "db_kone", "driver" => $driver),
        "user_db" => array("server" => "user_db", "driver" => $driver),
        "analytics_db" => array("server" => "analytics_db", "driver" => $driver),
        "db_sis" => array("server" => "db_sis", "driver" => $driver),
        "sis-importer-db" => array("server" => "sis-importer-db", "driver" => $driver)
    )
);
