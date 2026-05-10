import unittest
import requests

class TestApplyLoan(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.url = "http://localhost:3000/apply"
        cls.existing_rut = "12345678-9"

    def test_apply_success_min_months(self):
        """HU-02: Registro exitoso con el límite inferior de meses (1 mes)."""
        payload = {
            "fullname": "Ana Ramos",
            "rut": "99888777-6",
            "email": "ana.ramos@email.com",
            "amount": 500000, # Volvemos a números
            "months": 1 
        }
        
        # CAMBIO CLAVE: Usamos json=payload en lugar de data=payload
        response = requests.post(self.url, json=payload)
        
        # Imprimimos la respuesta en la terminal para depurar si falla
        if response.status_code != 200:
            print(f"\n[DEBUG ÉXITO] El servidor respondió: {response.text}")
            
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get("success"))
        self.assertIn("applicantId", response.json())

    def test_apply_error_duplicate_rut(self):
        """HU-02: Error al intentar registrar un RUT ya existente."""
        payload = {
            "fullname": "Copia de Juan",
            "rut": "11223344-5", # Usamos un RUT específico para esta prueba
            "email": "juan.copia@email.com",
            "amount": 150000,
            "months": 12
        }
        
        # 1. Enviamos la petición por PRIMERA vez (el sistema lo registra)
        requests.post(self.url, json=payload)
        
        # 2. Enviamos la MISMA petición por SEGUNDA vez (el sistema debe rechazarlo)
        response = requests.post(self.url, json=payload)
        
        # Ahora sí validamos que el segundo intento arroje 400
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json().get("success"))
        self.assertEqual(response.json().get("message"), "Ya existe una solicitud con este RUT")
    @classmethod
    def tearDownClass(cls):
        print("\n[HU-02] Pruebas de solicitud finalizadas.")

if __name__ == "__main__":
    unittest.main()