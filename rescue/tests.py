from django.test import TestCase
from django.urls import reverse


class HomePageTests(TestCase):
    def test_home_is_available(self):
        response = self.client.get(reverse("home"))
        self.assertContains(response, "<title>Rescate Nutria</title>", html=True)
        self.assertEqual(response.status_code, 200)

    def test_game_configuration_includes_canvas_game(self):
        response = self.client.get(reverse("home"))

        self.assertContains(response, 'id="game-form"')
        self.assertContains(response, 'value="En equipo"')
        self.assertContains(response, 'id="game"')
        self.assertContains(response, 'id="otter-canvas"')
        self.assertContains(response, 'id="trash-count"')
        self.assertContains(response, 'id="shell-count"')
        self.assertContains(response, 'id="score-count"')
        self.assertContains(response, 'id="best-score"')
