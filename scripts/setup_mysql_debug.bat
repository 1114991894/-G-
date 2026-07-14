@echo off
echo === Debug MySQL Setup ===
echo Checking MySQL installation...

"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --version
echo.

echo Checking data directory...
if exist "C:\Users\baiji\MySQL\data" (
    echo Data directory exists.
) else (
    echo Data directory does NOT exist.
)
echo.

echo Checking config file...
if exist "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini" (
    echo Config file exists.
    type "h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini"
) else (
    echo Config file does NOT exist.
)
echo.

echo Checking MySQL service...
sc query MySQL84 2>nul
if %errorlevel% equ 0 (
    echo MySQL service exists.
) else (
    echo MySQL service does NOT exist.
)

pause