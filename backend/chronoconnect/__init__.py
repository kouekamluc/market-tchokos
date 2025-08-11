# Configure GDAL library path for OSGeo4W - MUST BE FIRST
import os
import sys

# Set GDAL library path BEFORE any Django imports
gdal_path = r"C:\OSGeo4W\bin"
gdal_dll = os.path.join(gdal_path, "gdal311.dll")
if os.path.exists(gdal_dll):
    os.environ['GDAL_LIBRARY_PATH'] = gdal_dll
    os.environ['GEOS_LIBRARY_PATH'] = os.path.join(gdal_path, 'geos_c.dll')
    os.environ['PROJ_LIB'] = os.path.join(gdal_path, 'proj_9.dll')
    # Also set the PATH to include OSGeo4W bin directory
    os.environ['PATH'] = gdal_path + os.pathsep + os.environ.get('PATH', '')

# Add OSGeo4W Python to path
osgeo_path = r"C:\OSGeo4W\apps\Python39"  # Adjust version as needed
if os.path.exists(osgeo_path):
    sys.path.insert(0, osgeo_path)

# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
# from .celery import app as celery_app

# __all__ = ('celery_app',) 