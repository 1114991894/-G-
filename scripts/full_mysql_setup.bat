@echo off
echo ============================================
echo Full MySQL Server Setup for Windows
echo ============================================

cd /d "C:\Program Files\MySQL\MySQL Server 8.4\bin"

echo.
echo Step 1: Remove old service and data
echo ----------------------------------------
sc stop MySQL84
sc delete MySQL84
rmdir /s /q "C:\Users\baiji\MySQL\data"
mkdir "C:\Users\baiji\MySQL\data"
echo Old service and data removed.

echo.
echo Step 2: Initialize MySQL WITHOUT config file
echo ----------------------------------------
mysqld.exe --initialize-insecure --datadir="C:\Users\baiji\MySQL\data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"
echo Database initialized.

echo.
echo Step 3: Create clean config file
echo ----------------------------------------
echo [mysqld] > "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo datadir=C:/Users/baiji/MySQL/data >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo basedir=C:/Program Files/MySQL/MySQL Server 8.4 >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo port=3306 >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo server-id=1 >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo character-set-server=utf8mb4 >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo collation-server=utf8mb4_unicode_ci >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo. >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo [mysql] >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo default-character-set=utf8mb4 >> "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo Config file created.

echo.
echo Step 4: Install service
echo ----------------------------------------
mysqld.exe --install MySQL84 --defaults-file="h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo Service installed.

echo.
echo Step 5: Start service
echo ----------------------------------------
net start MySQL84
echo Service started.

echo.
echo Step 6: Verify and create database
echo ----------------------------------------
mysql.exe -u root -e "CREATE DATABASE bwg_performance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo Database created.

echo.
echo ============================================
echo MySQL Setup Completed Successfully!
echo ============================================
pause