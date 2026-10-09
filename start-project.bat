@echo off
title AI Interview Coach - Startup Manager
echo ===================================================
echo   AI Interview Coach Launcher
echo ===================================================
echo.

echo Starting Backend Service (Spring Boot)...
start "Backend - Spring Boot" cmd /k "cd backend && mvnw.cmd spring-boot:run"

echo Starting ML Service (Python)...
start "ML Service - Flask" cmd /k "cd ml_service && call venv\Scripts\activate && python app.py"

echo Starting Frontend Service (Vite + React)...
start "Frontend - Vite/React" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   All services have been started in separate windows.
echo   - Backend: http://localhost:8080
echo   - Frontend: http://localhost:5173
echo   - ML Service: http://localhost:5000
echo ===================================================
pause
