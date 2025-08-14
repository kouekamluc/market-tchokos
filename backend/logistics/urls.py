from django.urls import path
from . import views

urlpatterns = [
    # Delivery tasks
    path('tasks/', views.DeliveryTaskListView.as_view(), name='delivery-task-list'),
    path('tasks/<uuid:pk>/', views.DeliveryTaskDetailView.as_view(), name='delivery-task-detail'),
    
    # Agent specific
    path('agent/available-tasks/', views.AvailableTasksListView.as_view(), name='available-tasks'),
    path('agent/current-tasks/', views.CurrentTasksListView.as_view(), name='current-tasks'),
    path('agent/completed-tasks/', views.CompletedTasksListView.as_view(), name='completed-tasks'),
    path('agent/earnings/', views.DeliveryAgentEarningsListView.as_view(), name='agent-earnings'),
    path('agent/ratings/', views.DeliveryAgentRatingListView.as_view(), name='agent-ratings'),
    path('agent/schedules/', views.DeliveryScheduleListView.as_view(), name='agent-schedules'),
    path('agent/schedules/<int:pk>/', views.DeliveryScheduleDetailView.as_view(), name='agent-schedule-detail'),
    path('agent/dashboard-stats/', views.agent_dashboard_stats, name='agent-dashboard-stats'),
    
    # Agent actions
    path('agent/update-location/', views.update_delivery_location, name='update-delivery-location'),
    path('agent/accept-task/', views.accept_task, name='accept-task'),
    path('agent/tasks/<uuid:task_id>/update-status/', views.update_task_status, name='update-task-status'),
    path('agent/tasks/<uuid:task_id>/complete/', views.complete_task, name='complete-task'),
    
    # Delivery routes and zones (placeholder for future implementation)
    # path('routes/', views.DeliveryRouteListView.as_view(), name='delivery-routes'),
    # path('zones/', views.DeliveryZoneListView.as_view(), name='delivery-zones'),
] 