@echo off
echo ============================================
echo Final MySQL Fix for Version 8.4
echo ============================================

echo.
echo Step 1: Fix default my.ini in MySQL directory
echo ----------------------------------------
echo [mysqld] > "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo datadir=C:/Users/baiji/MySQL/data >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo basedir=C:/Program Files/MySQL/MySQL Server 8.4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo port=3306 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo server-id=1 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo character-set-server=utf8mb4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo collation-server=utf8mb4_unicode_ci >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo. >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo [mysql] >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo default-character-set=utf8mb4 >> "C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
echo Fixed default config file.

echo.
echo Step 2: Stop and remove old service
echo ----------------------------------------
sc stop MySQL84
sc delete MySQL84
echo Service stopped and deleted.

echo.
echo Step 3: Clean up data directory
echo ----------------------------------------
rmdir /s /q "C:\Users\baiji\MySQL\data"
mkdir "C:\Users\baiji\MySQL\data"
echo Data directory cleaned.

echo.
echo Step 4: Initialize MySQL database
echo ----------------------------------------
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\Users\baiji\MySQL\data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"
echo Database initialized.

echo.
echo Step 5: Install service
echo ----------------------------------------
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84
echo Service installed.

echo.
echo Step 6: Start MySQL service
echo ----------------------------------------
net start MySQL84
echo Service started.

echo.
echo Step 7: Create database
echo ----------------------------------------
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "CREATE DATABASE bwg_performance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo Database created.

echo.
echo ============================================
echo MySQL Setup Completed Successfully!
echo ============================================
pause