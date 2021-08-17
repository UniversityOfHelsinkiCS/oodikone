<?php
require_once('plugins/login-servers.php');
$driver = "pgsql";

/** Set supported servers
  * @param array array($description => array("server" => , "driver" => "server|pgsql|sqlite|..."))
*/
return new AdminerLoginServers(
    $servers = array(
        "kone-db" => array("server" => "kone-db", "driver" => $driver),
        "sis-db" => array("server" => "sis-db", "driver" => $driver),
        "sis-importer-db" => array("server" => "sis-importer-db", "driver" => $driver),
        "user-db" => array("server" => "user-db", "driver" => $driver)
    )
);
