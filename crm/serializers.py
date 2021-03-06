from rest_framework import serializers, relations
from . import models
from django.contrib.auth.models import User
from taggit_serializer.serializers import TagListSerializerField, TaggitSerializer
import address
from drf_enum_field.serializers import EnumFieldSerializerMixin

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'id')


class CitySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'id')

class LocalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Locality
        fields = ('name', 'postal_code')

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = address.models.Address
        fields = ('raw', 'street_number', 'route', 'locality')

class GeoField(serializers.Field):
    def to_representation(self, obj):
        return {'lat': obj.lat, 'lng': obj.lng,
                'neighborhood': obj.neighborhood}

    def get_attribute(self, obj):
        return obj

class PersonSerializer(TaggitSerializer, serializers.HyperlinkedModelSerializer):
    tags = TagListSerializerField()
    geo = GeoField()

    class Meta:
        model = models.Person
        fields = ('name',  'id', 'email', 'created', 'url', 'tags',
        'geo')

        lookup_field = 'email'
        extra_kwargs = {
                'url': {'lookup_field': 'email'},
                'id': {'source': 'email'}
        }
