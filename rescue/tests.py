from django.test import TestCase
from django.urls import reverse


class HomePageTests(TestCase):
    def test_home_is_available(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, "Rescate Nutria")
        self.assertEqual(response.status_code, 200)

    def test_game_configuration_includes_values_for_starting_a_mission(self):
        response = self.client.get(reverse("home"))

        self.assertContains(response, 'id="game-form"')
        self.assertContains(response, 'value="En equipo"')
        self.assertContains(response, 'id="mission"')
