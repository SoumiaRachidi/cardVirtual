# Generated migration for card_category field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cards', '0001_initial'),  # Adjust this to your latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='cartevirtuelle',
            name='card_category',
            field=models.CharField(
                choices=[
                    ('classic', 'Classic'),
                    ('gold', 'Gold'),
                    ('platinum', 'Platinum'),
                    ('diamond', 'Diamond'),
                ],
                default='classic',
                max_length=20
            ),
        ),
    ]
