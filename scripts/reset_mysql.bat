@echo off
echo ============================================
echo Resetting MySQL Server
echo ============================================

echo.
echo Step 1: Stop and delete existing service
echo ----------------------------------------
sc stop MySQL84
sc delete MySQL84
echo Service stopped and deleted.

echo.
echo Step 2: Clean up data directory
echo ----------------------------------------
rmdir /s /q "C:\Users\baiji\MySQL\data"
mkdir "C:\Users\baiji\MySQL\data"
echo Data directory cleaned.

echo.
echo Step 3: Initialize MySQL database
echo ----------------------------------------
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\Users\baiji\MySQL\data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"
echo Database initialized.

echo.
echo Step 4: Install service with correct config
echo ----------------------------------------
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --defaults-file="h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo Service installed.

echo.
echo Step 5: Start MySQL service
echo ----------------------------------------
net start MySQL84
echo Service started.

echo.
echo ============================================
echo MySQL setup completed!
echo ============================================
pause