# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-07-06 16:08
from __future__ import unicode_literals

from django.db import migrations, models

def migrate_descriptions(apps, schema_editor):
    ActionModel = apps.get_model('crm', 'Action')
    FormModel = apps.get_model('crm', 'Form')
    for form in FormModel.objects.all():
        action = form.action
        action.description = form.description
        action.save()

class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0009_auto_20170630_0540'),
    ]

    operations = [
        migrations.AddField(
            model_name='action',
            name='description',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
        migrations.RunPython(migrate_descriptions),
        migrations.RemoveField(
            model_name='form',
            name='description',
        ),
    ]