@echo off
echo === Cleaning up previous setup ===
rmdir /s /q "C:\Users\baiji\MySQL"
echo Previous data directory removed.

echo.
echo === Creating new data directory ===
mkdir "C:\Users\baiji\MySQL\data"
echo Data directory created.

echo.
echo === Initializing MySQL database ===
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\Users\baiji\MySQL\data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"
echo Database initialized.

echo.
echo === Installing MySQL service ===
sc delete MySQL84
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --defaults-file="h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
echo Service installed.

echo.
echo === Starting MySQL service ===
net start MySQL84
echo Service started.

echo.
echo === Checking MySQL status ===
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe" -u root status
echo.

pause