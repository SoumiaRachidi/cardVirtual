from django.core.management.base import BaseCommand
from cards.models import CarteVirtuelle
from datetime import date


class Command(BaseCommand):
    help = 'Test card generation functionality'

    def handle(self, *args, **options):
        self.stdout.write("🧪 Testing Card Generation System")
        self.stdout.write("=" * 50)
        
        # Test card number generation for different types
        card_types = ['personal', 'business', 'travel', 'shopping']
        
        for card_type in card_types:
            card_number = CarteVirtuelle.generate_card_number(card_type)
            self.stdout.write(f"\n🔢 {card_type.title()} Card Number: {card_number}")
            
            # Test CVV generation
            test_expiry = date(2029, 12, 31)
            cvv = CarteVirtuelle.generate_cvv(card_number, test_expiry)
            self.stdout.write(f"   🔐 CVV: {cvv}")
            
        # Test card categories
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("💎 Testing Card Categories")
        
        limits = [500, 1500, 3000, 7000, 15000]
        for limit in limits:
            category = CarteVirtuelle.determine_card_category(limit)
            expiry = CarteVirtuelle.calculate_expiry_date(category)
            self.stdout.write(f"Limit: ${limit:,} → {category.title()} → Expires: {expiry}")
            
        self.stdout.write(f"\n✅ Card generation test completed!")
