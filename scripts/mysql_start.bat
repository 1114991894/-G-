@echo off
echo Setting permissions...
icacls "C:\Users\baiji\MySQL\data" /grant Everyone:F /T

echo Starting MySQL...
cd /d "C:\Users\baiji\MySQL\data"
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="h:\7、百鲸咨询\2.产品\2.软件与设计\2.小程序\代码\3.0\scripts\my_simple.ini" --console