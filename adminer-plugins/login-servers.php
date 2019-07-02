<?php
require_once('plugins/login-servers.php');

/** Set supported servers
    * @param array array($domain) or array($domain => $description) or array($category => array())
    * @param string
    */
return new AdminerLoginServers(
    $servers = array("db" => "db", "db_kone" => "db_kone", "user_db" => "user_db", "analytics_db" => "analytics_db"),
    $driver = "pgsql"
);
