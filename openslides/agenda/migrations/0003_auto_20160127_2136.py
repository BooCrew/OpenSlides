# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-01-27 21:36
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0002_auto_20160122_2318'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='weight',
            field=models.IntegerField(default=10000),
        ),
    ]