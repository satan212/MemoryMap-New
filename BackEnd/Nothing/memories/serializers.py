# serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Memory

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid username or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError('Must include username and password.')

class MemorySerializer(serializers.ModelSerializer):
    uploaded_by = serializers.CharField(required=True)
    
    class Meta:
        model = Memory
        fields = ('id', 'title', 'description', 'uploaded_by', 'tags', 'lat', 'lng', 
                 'created_at', 'file_name', 'file_content')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        # Set the user from the request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class MemoryLocationSerializer(serializers.Serializer):
    lat = serializers.DecimalField(max_digits=10, decimal_places=8)
    lng = serializers.DecimalField(max_digits=11, decimal_places=8)
    tolerance = serializers.DecimalField(max_digits=5, decimal_places=4, default=0.001)

class MemoryTagSearchSerializer(serializers.Serializer):
    tag = serializers.CharField(max_length=100)