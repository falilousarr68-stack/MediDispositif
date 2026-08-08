"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/catalogue/', include('catalogue.urls')),
    path('api/ventes/', include('ventes.urls')),
    path('api/systeme/', include('systeme.urls')),
]
