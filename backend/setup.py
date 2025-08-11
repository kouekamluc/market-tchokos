#!/usr/bin/env python
"""
ChronoConnect Django Setup Script
This script helps set up the Django project for development.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description, use_shell=False):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        if isinstance(command, str) and not use_shell:
            # Split command into list for better Windows compatibility
            command = command.split()
        
        result = subprocess.run(command, shell=use_shell, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check if pip is available
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"], check=True, capture_output=True)
        print("✅ pip is available")
    except subprocess.CalledProcessError:
        print("❌ pip is not available")
        return False
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Upgrade pip
    if not run_command([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], "Upgrading pip"):
        return False
    
    # Install requirements
    if not run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], "Installing requirements"):
        return False
    
    return True

def setup_environment():
    """Set up environment variables"""
    print("\n🔧 Setting up environment...")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("📝 Creating .env file from .env.example...")
        try:
            with open(env_example, 'r') as f:
                content = f.read()
            
            # Replace placeholder values with development defaults
            content = content.replace("your-secret-key-here", "django-insecure-chronoconnect-dev-secret-key-2024")
            content = content.replace("your-db-password", "postgres")
            content = content.replace("your-email@gmail.com", "dev@chronoconnect.com")
            content = content.replace("your-email-password", "dev-password")
            content = content.replace("your-mapbox-access-token", "pk.eyJ1IjoiY2hyb25vY29ubmVjdCIsImEiOiJjbGV4YW1wbGUifQ.example")
            
            with open(env_file, 'w') as f:
                f.write(content)
            
            print("✅ .env file created successfully")
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️  No .env.example file found, you'll need to create .env manually")
    
    return True

def setup_database():
    """Set up the database"""
    print("\n🗄️  Setting up database...")
    
    # Make migrations
    if not run_command([sys.executable, "manage.py", "makemigrations"], "Creating migrations"):
        return False
    
    # Run migrations
    if not run_command([sys.executable, "manage.py", "migrate"], "Running migrations"):
        return False
    
    return True

def create_superuser():
    """Create a superuser"""
    print("\n👤 Creating superuser...")
    
    # Check if superuser already exists
    try:
        result = subprocess.run(
            [sys.executable, "manage.py", "shell", "-c", "from users.models import User; print('Superuser exists' if User.objects.filter(is_superuser=True).exists() else 'No superuser')"],
            capture_output=True, text=True
        )
        
        if "Superuser exists" in result.stdout:
            print("✅ Superuser already exists")
            return True
    except:
        pass
    
    # Create superuser
    print("Please create a superuser account:")
    if not run_command([sys.executable, "manage.py", "createsuperuser"], "Creating superuser"):
        print("⚠️  Superuser creation failed, you can create one manually later")
        return False
    
    return True

def collect_static():
    """Collect static files"""
    print("\n📁 Collecting static files...")
    
    if not run_command([sys.executable, "manage.py", "collectstatic", "--noinput"], "Collecting static files"):
        return False
    
    return True

def run_tests():
    """Run basic tests"""
    print("\n🧪 Running tests...")
    
    if not run_command([sys.executable, "manage.py", "test", "--verbosity=2"], "Running tests"):
        print("⚠️  Some tests failed, but setup can continue")
        return False
    
    return True

def main():
    """Main setup function"""
    print("🚀 ChronoConnect Django Setup")
    print("=" * 40)
    
    # Change to the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Dependency installation failed")
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        print("❌ Environment setup failed")
        sys.exit(1)
    
    # Setup database
    if not setup_database():
        print("❌ Database setup failed")
        sys.exit(1)
    
    # Create superuser
    create_superuser()
    
    # Collect static files
    if not collect_static():
        print("❌ Static file collection failed")
        sys.exit(1)
    
    # Run tests
    run_tests()
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Start the development server: python manage.py runserver")
    print("2. Access the admin interface: http://localhost:8000/admin/")
    print("3. Access the API: http://localhost:8000/api/")
    print("4. Check the documentation: README.md")

if __name__ == "__main__":
    main() 