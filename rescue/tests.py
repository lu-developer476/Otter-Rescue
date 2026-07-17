from django.test import TestCase
from django.urls import reverse


class HomePageTests(TestCase):
    def test_home_is_available(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, "Rescate Nutria")
        self.assertEqual(response.status_code, 200)
