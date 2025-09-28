# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Authentication URLs
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    
    # Memory URLs
    path('memories/', views.MemoryListCreateView.as_view(), name='memory_list_create'),
    path('memories/<uuid:pk>/', views.MemoryDetailView.as_view(), name='memory_detail'),
    path('memories/by-location/', views.memories_by_location_view, name='memories_by_location'),
    path('memories/search/', views.search_memories_by_tag_view, name='search_memories_by_tag'),
    path('memories/tags/', views.get_all_tags_view, name='get_all_tags'),
    path('memories/closest/', views.get_closest_memory_view, name='get_closest_memory'),
    path('memories/upload/', views.upload_file_view, name='upload_file'),
]