import unittest
import requests

class TestPayInstallment(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Configuración inicial: URL del endpoint y IDs de prueba."""
        cls.url = "http://localhost:3000/pay-installment" 
        
        # CAMBIO 2: Reemplaza estos números con IDs reales de tu Base de Datos
        cls.valid_installment_id = 12  
        cls.already_paid_id = 8

    def test_pay_success(self):
        """HU-04: Pago exitoso de una cuota pendiente."""
        payload = {"installmentId": self.valid_installment_id}
        
        # Enviamos como JSON
        response = requests.post(self.url, json=payload)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get("success"))

    def test_pay_already_paid_error(self):
        """HU-04: Error al intentar pagar una cuota que ya está pagada."""
        payload = {"installmentId": self.already_paid_id}
        
        # 1. Pagamos la cuota por PRIMERA vez (por si estaba pendiente, la pagamos ahora)
        requests.post(self.url, json=payload)
        
        # 2. Intentamos pagar la MISMA cuota por SEGUNDA vez (aquí el sistema DEBE rechazarlo)
        response = requests.post(self.url, json=payload)
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json().get("success"))
        self.assertEqual(response.json().get("message"), "Ya pagada")

    def test_pay_not_found(self):
        """HU-04: Error cuando el ID de la cuota no existe (404)."""
        payload = {"installmentId": 999999} # ID inexistente
        
        response = requests.post(self.url, json=payload)
        
        self.assertEqual(response.status_code, 404)
        self.assertFalse(response.json().get("success"))

    @classmethod
    def tearDownClass(cls):
        print("\n[HU-04] Pruebas de pago finalizadas.")