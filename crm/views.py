# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from . import models, serializers
from django.views.decorators.clickjacking import xframe_options_exempt
import json


def index(request, *args, **kwargs):
    return render(request, 'index.html')

@xframe_options_exempt
def view_action(request, action_id, action_slug=None):
    action = models.Action.objects.get(pk=action_id)
    serializer = serializers.ViewActionSerializer(action, context={'request': request})
    return render(request, 'form.html', {
        'action_obj': action, 
        'action_data': json.dumps(serializer.data),
    })
