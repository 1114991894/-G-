@echo off
echo Creating data directory...
mkdir "C:\Program Files\MySQL\MySQL Server 8.4\data"

echo Initializing MySQL database...
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --initialize-insecure --datadir="C:\Program Files\MySQL\MySQL Server 8.4\data" --basedir="C:\Program Files\MySQL\MySQL Server 8.4"

echo Installing MySQL service...
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --defaults-file="C:\Program Files\MySQL\MySQL Server 8.4\my.ini"

echo Starting MySQL service...
net start MySQL84

echo MySQL setup completed!