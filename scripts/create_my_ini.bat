@echo off
echo [mysqld] > "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo datadir=C:/Program Files/MySQL/MySQL Server 8.4/data >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo basedir=C:/Program Files/MySQL/MySQL Server 8.4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo port=3306 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo server-id=1 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo character-set-server=utf8mb4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo collation-server=utf8mb4_unicode_ci >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo default-authentication-plugin=mysql_native_password >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo. >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo [mysql] >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo default-character-set=utf8mb4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo Configuration file created successfully!