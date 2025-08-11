@echo off
echo Starting ChronoConnect Frontend-Backend Integration...
echo.

echo Step 1: Starting Django Backend...
cd backend
start "Django Backend" cmd /k "python manage.py runserver 8000"
timeout /t 3 /nobreak >nul

echo Step 2: Starting React Frontend...
cd ..\frontend
start "React Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo Integration started!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8090
echo Test Page: http://localhost:8090/test-integration
echo Django Admin: http://localhost:8000/admin
echo.
echo Press any key to exit...
pause >nul 