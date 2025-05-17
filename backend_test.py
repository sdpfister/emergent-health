
import requests
import sys
from datetime import datetime, date
import json
import time

class HealthTrackerAPITester:
    def __init__(self, base_url="https://2260c1cd-2dd8-4952-bff7-9d364ff6a79b.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            "body_composition": [],
            "body_measurements": [],
            "health_markers": [],
            "supplements": [],
            "peptides": []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if method == 'POST' and response.status_code == 200:
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, response.json() if 'application/json' in response.headers.get('Content-Type', '') else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root(self):
        """Test the root API endpoint"""
        return self.run_test("Root API endpoint", "GET", "", 200)

    def test_body_composition(self):
        """Test body composition endpoints"""
        # Create a new body composition entry
        data = {
            "date": date.today().isoformat(),
            "weight": 180.5,
            "body_fat_percentage": 15.2,
            "muscle_mass": 150.3,
            "water_percentage": 60.1,
            "bone_mass": 8.5,
            "bmi": 24.8,
            "notes": "Test entry"
        }
        
        success, response = self.run_test(
            "Create body composition entry",
            "POST",
            "body-composition",
            200,
            data=data
        )
        
        if success and 'id' in response:
            entry_id = response['id']
            self.created_ids["body_composition"].append(entry_id)
            
            # Get the created entry
            success, _ = self.run_test(
                "Get body composition entry",
                "GET",
                f"body-composition/{entry_id}",
                200
            )
            
            # Get all entries
            success, all_entries = self.run_test(
                "Get all body composition entries",
                "GET",
                "body-composition",
                200
            )
            
            # Update the entry
            update_data = data.copy()
            update_data["weight"] = 182.0
            success, _ = self.run_test(
                "Update body composition entry",
                "PUT",
                f"body-composition/{entry_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def test_body_measurements(self):
        """Test body measurements endpoints"""
        # Create a new body measurement entry
        data = {
            "date": date.today().isoformat(),
            "chest": 42.5,
            "waist": 34.0,
            "hips": 40.2,
            "arms": 15.5,
            "legs": 24.0,
            "notes": "Test measurement"
        }
        
        success, response = self.run_test(
            "Create body measurement entry",
            "POST",
            "body-measurements",
            200,
            data=data
        )
        
        if success and 'id' in response:
            entry_id = response['id']
            self.created_ids["body_measurements"].append(entry_id)
            
            # Get the created entry
            success, _ = self.run_test(
                "Get body measurement entry",
                "GET",
                f"body-measurements/{entry_id}",
                200
            )
            
            # Get all entries
            success, all_entries = self.run_test(
                "Get all body measurement entries",
                "GET",
                "body-measurements",
                200
            )
            
            # Update the entry
            update_data = data.copy()
            update_data["waist"] = 33.5
            success, _ = self.run_test(
                "Update body measurement entry",
                "PUT",
                f"body-measurements/{entry_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def test_health_markers(self):
        """Test health markers endpoints"""
        # Create a new health marker entry
        data = {
            "date": date.today().isoformat(),
            "blood_pressure": {
                "systolic": 120,
                "diastolic": 80,
                "pulse": 72
            },
            "lipid_panel": {
                "total_cholesterol": 180.0,
                "hdl": 50.0,
                "ldl": 110.0,
                "triglycerides": 100.0
            },
            "notes": "Test health markers"
        }
        
        success, response = self.run_test(
            "Create health marker entry",
            "POST",
            "health-markers",
            200,
            data=data
        )
        
        if success and 'id' in response:
            entry_id = response['id']
            self.created_ids["health_markers"].append(entry_id)
            
            # Get the created entry
            success, _ = self.run_test(
                "Get health marker entry",
                "GET",
                f"health-markers/{entry_id}",
                200
            )
            
            # Get all entries
            success, all_entries = self.run_test(
                "Get all health marker entries",
                "GET",
                "health-markers",
                200
            )
            
            # Update the entry
            update_data = data.copy()
            update_data["blood_pressure"]["systolic"] = 118
            success, _ = self.run_test(
                "Update health marker entry",
                "PUT",
                f"health-markers/{entry_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def test_supplements(self):
        """Test supplements endpoints"""
        # Create a new supplement entry
        data = {
            "name": "Test Vitamin D",
            "dosage": "5000",
            "unit": "IU",
            "schedule": {
                "frequency": "daily",
                "times_per_day": 1,
                "time_of_day": ["morning"],
                "cycle_weeks_on": None,
                "cycle_weeks_off": None
            },
            "notes": "Test supplement"
        }
        
        success, response = self.run_test(
            "Create supplement entry",
            "POST",
            "supplements",
            200,
            data=data
        )
        
        if success and 'id' in response:
            entry_id = response['id']
            self.created_ids["supplements"].append(entry_id)
            
            # Get the created entry
            success, _ = self.run_test(
                "Get supplement entry",
                "GET",
                f"supplements/{entry_id}",
                200
            )
            
            # Get all entries
            success, all_entries = self.run_test(
                "Get all supplement entries",
                "GET",
                "supplements",
                200
            )
            
            # Update the entry
            update_data = data.copy()
            update_data["dosage"] = "10000"
            success, _ = self.run_test(
                "Update supplement entry",
                "PUT",
                f"supplements/{entry_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def test_peptide_calculator(self):
        """Test peptide calculator endpoint"""
        data = {
            "vial_amount_mg": 5.0,
            "bac_water_ml": 2.0,
            "dose_mcg": 250.0
        }
        
        success, response = self.run_test(
            "Calculate peptide IU",
            "POST",
            "peptides/calculate-iu",
            200,
            data=data
        )
        
        if success and 'iu' in response:
            print(f"Calculated IU: {response['iu']}")
            return True
        return False

    def test_peptides(self):
        """Test peptides endpoints"""
        # Create a new peptide entry
        data = {
            "name": "Test BPC-157",
            "vial_amount_mg": 5.0,
            "bac_water_ml": 2.0,
            "dose_mcg": 250.0,
            "injection_needle_size": "30G 1/2\"",
            "schedule": {
                "frequency": "daily",
                "times_per_day": 2,
                "time_of_day": ["morning", "evening"],
                "cycle_weeks_on": 8,
                "cycle_weeks_off": 2
            },
            "notes": "Test peptide"
        }
        
        success, response = self.run_test(
            "Create peptide entry",
            "POST",
            "peptides",
            200,
            data=data
        )
        
        if success and 'id' in response:
            entry_id = response['id']
            self.created_ids["peptides"].append(entry_id)
            
            # Get the created entry
            success, _ = self.run_test(
                "Get peptide entry",
                "GET",
                f"peptides/{entry_id}",
                200
            )
            
            # Get all entries
            success, all_entries = self.run_test(
                "Get all peptide entries",
                "GET",
                "peptides",
                200
            )
            
            # Update the entry
            update_data = data.copy()
            update_data["dose_mcg"] = 300.0
            success, _ = self.run_test(
                "Update peptide entry",
                "PUT",
                f"peptides/{entry_id}",
                200,
                data=update_data
            )
            
            return True
        return False

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        for category, ids in self.created_ids.items():
            for entry_id in ids:
                endpoint = category.replace("_", "-")
                self.run_test(
                    f"Delete {category} entry",
                    "DELETE",
                    f"{endpoint}/{entry_id}",
                    200
                )

def main():
    tester = HealthTrackerAPITester()
    
    # Test root endpoint
    tester.test_root()
    
    # Test body composition endpoints
    tester.test_body_composition()
    
    # Test body measurements endpoints
    tester.test_body_measurements()
    
    # Test health markers endpoints
    tester.test_health_markers()
    
    # Test supplements endpoints
    tester.test_supplements()
    
    # Test peptide calculator
    tester.test_peptide_calculator()
    
    # Test peptides endpoints
    tester.test_peptides()
    
    # Clean up test data
    tester.cleanup()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
