# views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from decimal import Decimal
import math
from .models import User, Memory
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    LoginSerializer, 
    MemorySerializer,
    MemoryLocationSerializer,
    MemoryTagSearchSerializer
)

# Auth Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# Memory Views
class MemoryListCreateView(generics.ListCreateAPIView):
    serializer_class = MemorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MemoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MemorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def memories_by_location_view(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    tolerance = request.GET.get('tolerance', '0.001')
    
    if not lat or not lng:
        return Response(
            {'error': 'lat and lng parameters are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lat = Decimal(lat)
        lng = Decimal(lng)
        tolerance = Decimal(tolerance)
    except:
        return Response(
            {'error': 'Invalid coordinate format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find memories within tolerance
    memories = Memory.objects.filter(
        user=request.user,
        lat__gte=lat - tolerance,
        lat__lte=lat + tolerance,
        lng__gte=lng - tolerance,
        lng__lte=lng + tolerance
    )
    
    serializer = MemorySerializer(memories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_memories_by_tag_view(request):
    tag = request.GET.get('tag', '').lower()
    
    if not tag:
        return Response(
            {'error': 'tag parameter is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Search in JSON field
    memories = Memory.objects.filter(
        user=request.user,
        tags__icontains=tag
    )
    
    # Filter more precisely in Python for exact matches
    filtered_memories = []
    for memory in memories:
        memory_tags = [t.lower() for t in memory.get_tags_list()]
        if any(tag in memory_tag for memory_tag in memory_tags):
            filtered_memories.append(memory)
    
    serializer = MemorySerializer(filtered_memories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_tags_view(request):
    memories = Memory.objects.filter(user=request.user)
    all_tags = []
    
    for memory in memories:
        all_tags.extend(memory.get_tags_list())
    
    # Remove duplicates and sort
    unique_tags = sorted(list(set(all_tags)))
    return Response(unique_tags)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_closest_memory_view(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    
    if not lat or not lng:
        return Response(
            {'error': 'lat and lng parameters are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        target_lat = float(lat)
        target_lng = float(lng)
    except:
        return Response(
            {'error': 'Invalid coordinate format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    memories = Memory.objects.filter(user=request.user)
    
    if not memories.exists():
        return Response(None)
    
    closest_memory = None
    min_distance = float('inf')
    
    for memory in memories:
        # Calculate distance using Haversine formula
        distance = calculate_distance(
            target_lat, target_lng, 
            float(memory.lat), float(memory.lng)
        )
        
        if distance < min_distance:
            min_distance = distance
            closest_memory = memory
    
    if closest_memory:
        serializer = MemorySerializer(closest_memory)
        return Response(serializer.data)
    
    return Response(None)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth"""
    R = 6371  # Radius of the earth in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c  # Distance in kilometers
    return distance

# File upload view (for demo purposes)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file_view(request):
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    uploaded_file = request.FILES['file']
    
    # In a real application, you would save the file to a storage service
    # For demo purposes, we'll just return the filename
    return Response({
        'fileName': uploaded_file.name,
        'fileUrl': f'/media/uploads/{uploaded_file.name}'  # Mock URL
    })