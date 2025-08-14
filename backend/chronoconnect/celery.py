import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronoconnect.settings')

app = Celery('chronoconnect')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule Configuration
app.conf.beat_schedule = {
    'calculate-eta-every-30-seconds': {
        'task': 'logistics.tasks.calculate_eta_for_active_deliveries',
        'schedule': 30.0,  # Every 30 seconds
    },
    'cleanup-old-records-daily': {
        'task': 'logistics.tasks.cleanup_old_location_records',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'update-delivery-statuses-hourly': {
        'task': 'logistics.tasks.update_delivery_task_status',
        'schedule': crontab(minute=0),  # Every hour
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 