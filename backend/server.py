from fastapi import FastAPI, APIRouter, HTTPException, Body, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import List, Optional, Dict, Union, Any
import uuid
from datetime import datetime, date
import json

# Define a JSONEncoder subclass to handle date objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Health Tracking API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class BaseDBModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Weight and Body Composition Models
class BodyComposition(BaseDBModel):
    date: date
    weight: float
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    water_percentage: Optional[float] = None
    bone_mass: Optional[float] = None
    bmi: Optional[float] = None
    notes: Optional[str] = None

class BodyCompositionCreate(BaseModel):
    date: date
    weight: float
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    water_percentage: Optional[float] = None
    bone_mass: Optional[float] = None
    bmi: Optional[float] = None
    notes: Optional[str] = None

# Health Markers Models
class BloodPressure(BaseModel):
    systolic: int
    diastolic: int
    pulse: Optional[int] = None

class LipidPanel(BaseModel):
    total_cholesterol: float
    hdl: float
    ldl: float
    triglycerides: float
    total_cholesterol_hdl_ratio: Optional[float] = None

class CBCPanel(BaseModel):
    wbc: float
    rbc: float
    hemoglobin: float
    hematocrit: float
    platelets: float
    other_values: Optional[Dict[str, Any]] = None

class HealthMarker(BaseDBModel):
    date: date
    blood_pressure: Optional[BloodPressure] = None
    lipid_panel: Optional[LipidPanel] = None
    cbc_panel: Optional[CBCPanel] = None
    other_markers: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class HealthMarkerCreate(BaseModel):
    date: date
    blood_pressure: Optional[BloodPressure] = None
    lipid_panel: Optional[LipidPanel] = None
    cbc_panel: Optional[CBCPanel] = None
    other_markers: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

# Body Measurements Models
class BodyMeasurement(BaseDBModel):
    date: date
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    arms: Optional[float] = None
    legs: Optional[float] = None
    other_measurements: Optional[Dict[str, float]] = None
    notes: Optional[str] = None

class BodyMeasurementCreate(BaseModel):
    date: date
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    arms: Optional[float] = None
    legs: Optional[float] = None
    other_measurements: Optional[Dict[str, float]] = None
    notes: Optional[str] = None

# Supplements Models
class ScheduleFrequency(str):
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"
    M_F = "monday-friday"

class TimeOfDay(str):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"
    CUSTOM = "custom"

class SupplementSchedule(BaseModel):
    frequency: str  # daily, weekly, custom, monday-friday
    times_per_day: int
    time_of_day: List[str]  # morning, afternoon, evening, or specific times
    cycle_weeks_on: Optional[int] = None
    cycle_weeks_off: Optional[int] = None
    custom_days: Optional[List[str]] = None  # For custom schedules
    custom_times: Optional[List[str]] = None  # For custom time entries

class Supplement(BaseDBModel):
    name: str
    dosage: str
    unit: str
    schedule: SupplementSchedule
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SupplementCreate(BaseModel):
    name: str
    dosage: str
    unit: str
    schedule: SupplementSchedule
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Peptide Models
class PeptideCalculation(BaseModel):
    vial_amount_mg: float
    bac_water_ml: float
    dose_mcg: float
    
    @field_validator('vial_amount_mg', 'bac_water_ml', 'dose_mcg')
    @classmethod
    def validate_positive(cls, v, info):
        if v <= 0:
            field_name = info.field_name.replace('_', ' ').title()
            raise ValueError(f'{field_name} must be greater than 0')
        return v
    
    def calculate_iu(self) -> float:
        """Calculate IU based on the peptide dosage formula"""
        vial_amount_mcg = self.vial_amount_mg * 1000  # Convert mg to mcg
        concentration = vial_amount_mcg / self.bac_water_ml  # mcg/ml
        volume_ml = self.dose_mcg / concentration  # ml
        iu = volume_ml * 100  # Convert ml to IU
        return round(iu, 2)

class Peptide(BaseDBModel):
    name: str
    vial_amount_mg: float
    bac_water_ml: float
    dose_mcg: float
    injection_needle_size: str
    calculated_iu: float
    schedule: SupplementSchedule
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class PeptideCreate(BaseModel):
    name: str
    vial_amount_mg: float
    bac_water_ml: float
    dose_mcg: float
    injection_needle_size: str
    schedule: SupplementSchedule
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    @field_validator('vial_amount_mg', 'bac_water_ml', 'dose_mcg')
    def validate_positive(cls, v, info):
        if v <= 0:
            field_name = info.field_name.replace('_', ' ').title()
            raise ValueError(f'{field_name} must be greater than 0')
        return v

# API Routes for Body Composition
@api_router.post("/body-composition", response_model=BodyComposition)
async def create_body_composition(data: BodyCompositionCreate):
    body_composition = BodyComposition(**data.dict())
    body_composition_dict = json.loads(json.dumps(body_composition.dict(), cls=DateTimeEncoder))
    await db.body_compositions.insert_one(body_composition_dict)
    return body_composition

@api_router.get("/body-composition", response_model=List[BodyComposition])
async def get_body_compositions(limit: int = 100, skip: int = 0):
    compositions = await db.body_compositions.find().sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [BodyComposition(**composition) for composition in compositions]

@api_router.get("/body-composition/{composition_id}", response_model=BodyComposition)
async def get_body_composition(composition_id: str):
    composition = await db.body_compositions.find_one({"id": composition_id})
    if not composition:
        raise HTTPException(status_code=404, detail="Body composition not found")
    return BodyComposition(**composition)

@api_router.put("/body-composition/{composition_id}", response_model=BodyComposition)
async def update_body_composition(composition_id: str, data: BodyCompositionCreate):
    composition = await db.body_compositions.find_one({"id": composition_id})
    if not composition:
        raise HTTPException(status_code=404, detail="Body composition not found")
    
    updated_composition = BodyComposition(**composition)
    update_data = data.dict(exclude_unset=True)
    
    # Update the fields
    for field, value in update_data.items():
        setattr(updated_composition, field, value)
    
    # Update the updated_at timestamp
    updated_composition.updated_at = datetime.utcnow()
    
    await db.body_compositions.replace_one({"id": composition_id}, json.loads(json.dumps(updated_composition.dict(), cls=DateTimeEncoder)))
    return updated_composition

@api_router.delete("/body-composition/{composition_id}")
async def delete_body_composition(composition_id: str):
    result = await db.body_compositions.delete_one({"id": composition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Body composition not found")
    return {"detail": "Body composition deleted successfully"}

# API Routes for Health Markers
@api_router.post("/health-markers", response_model=HealthMarker)
async def create_health_marker(data: HealthMarkerCreate):
    health_marker = HealthMarker(**data.dict())
    health_marker_dict = json.loads(json.dumps(health_marker.dict(), cls=DateTimeEncoder))
    await db.health_markers.insert_one(health_marker_dict)
    return health_marker

@api_router.get("/health-markers", response_model=List[HealthMarker])
async def get_health_markers(limit: int = 100, skip: int = 0):
    markers = await db.health_markers.find().sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [HealthMarker(**marker) for marker in markers]

@api_router.get("/health-markers/{marker_id}", response_model=HealthMarker)
async def get_health_marker(marker_id: str):
    marker = await db.health_markers.find_one({"id": marker_id})
    if not marker:
        raise HTTPException(status_code=404, detail="Health marker not found")
    return HealthMarker(**marker)

@api_router.put("/health-markers/{marker_id}", response_model=HealthMarker)
async def update_health_marker(marker_id: str, data: HealthMarkerCreate):
    marker = await db.health_markers.find_one({"id": marker_id})
    if not marker:
        raise HTTPException(status_code=404, detail="Health marker not found")
    
    updated_marker = HealthMarker(**marker)
    update_data = data.dict(exclude_unset=True)
    
    # Update the fields
    for field, value in update_data.items():
        setattr(updated_marker, field, value)
    
    # Update the updated_at timestamp
    updated_marker.updated_at = datetime.utcnow()
    
    await db.health_markers.replace_one({"id": marker_id}, json.loads(json.dumps(updated_marker.dict(), cls=DateTimeEncoder)))
    return updated_marker

@api_router.delete("/health-markers/{marker_id}")
async def delete_health_marker(marker_id: str):
    result = await db.health_markers.delete_one({"id": marker_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Health marker not found")
    return {"detail": "Health marker deleted successfully"}

# API Routes for Body Measurements
@api_router.post("/body-measurements", response_model=BodyMeasurement)
async def create_body_measurement(data: BodyMeasurementCreate):
    body_measurement = BodyMeasurement(**data.dict())
    body_measurement_dict = json.loads(json.dumps(body_measurement.dict(), cls=DateTimeEncoder))
    await db.body_measurements.insert_one(body_measurement_dict)
    return body_measurement

@api_router.get("/body-measurements", response_model=List[BodyMeasurement])
async def get_body_measurements(limit: int = 100, skip: int = 0):
    measurements = await db.body_measurements.find().sort("date", -1).skip(skip).limit(limit).to_list(limit)
    return [BodyMeasurement(**measurement) for measurement in measurements]

@api_router.get("/body-measurements/{measurement_id}", response_model=BodyMeasurement)
async def get_body_measurement(measurement_id: str):
    measurement = await db.body_measurements.find_one({"id": measurement_id})
    if not measurement:
        raise HTTPException(status_code=404, detail="Body measurement not found")
    return BodyMeasurement(**measurement)

@api_router.put("/body-measurements/{measurement_id}", response_model=BodyMeasurement)
async def update_body_measurement(measurement_id: str, data: BodyMeasurementCreate):
    measurement = await db.body_measurements.find_one({"id": measurement_id})
    if not measurement:
        raise HTTPException(status_code=404, detail="Body measurement not found")
    
    updated_measurement = BodyMeasurement(**measurement)
    update_data = data.dict(exclude_unset=True)
    
    # Update the fields
    for field, value in update_data.items():
        setattr(updated_measurement, field, value)
    
    # Update the updated_at timestamp
    updated_measurement.updated_at = datetime.utcnow()
    
    await db.body_measurements.replace_one({"id": measurement_id}, json.loads(json.dumps(updated_measurement.dict(), cls=DateTimeEncoder)))
    return updated_measurement

@api_router.delete("/body-measurements/{measurement_id}")
async def delete_body_measurement(measurement_id: str):
    result = await db.body_measurements.delete_one({"id": measurement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Body measurement not found")
    return {"detail": "Body measurement deleted successfully"}

# API Routes for Supplements
@api_router.post("/supplements", response_model=Supplement)
async def create_supplement(data: SupplementCreate):
    supplement = Supplement(**data.dict())
    supplement_dict = json.loads(json.dumps(supplement.dict(), cls=DateTimeEncoder))
    await db.supplements.insert_one(supplement_dict)
    return supplement

@api_router.get("/supplements", response_model=List[Supplement])
async def get_supplements(limit: int = 100, skip: int = 0):
    supplements = await db.supplements.find().sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return [Supplement(**supplement) for supplement in supplements]

@api_router.get("/supplements/{supplement_id}", response_model=Supplement)
async def get_supplement(supplement_id: str):
    supplement = await db.supplements.find_one({"id": supplement_id})
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return Supplement(**supplement)

@api_router.put("/supplements/{supplement_id}", response_model=Supplement)
async def update_supplement(supplement_id: str, data: SupplementCreate):
    supplement = await db.supplements.find_one({"id": supplement_id})
    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")
    
    updated_supplement = Supplement(**supplement)
    update_data = data.dict(exclude_unset=True)
    
    # Update the fields
    for field, value in update_data.items():
        setattr(updated_supplement, field, value)
    
    # Update the updated_at timestamp
    updated_supplement.updated_at = datetime.utcnow()
    
    await db.supplements.replace_one({"id": supplement_id}, json.loads(json.dumps(updated_supplement.dict(), cls=DateTimeEncoder)))
    return updated_supplement

@api_router.delete("/supplements/{supplement_id}")
async def delete_supplement(supplement_id: str):
    result = await db.supplements.delete_one({"id": supplement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return {"detail": "Supplement deleted successfully"}

# API Routes for Peptides
@api_router.post("/peptides/calculate-iu", response_model=Dict[str, Union[float, Dict[str, float]]])
async def calculate_peptide_iu(calculation: PeptideCalculation):
    try:
        iu = calculation.calculate_iu()
        
        # Additional information for UI display
        vial_amount_mcg = calculation.vial_amount_mg * 1000
        concentration_mcg_ml = vial_amount_mcg / calculation.bac_water_ml
        volume_ml = calculation.dose_mcg / concentration_mcg_ml
        
        return {
            "iu": iu,
            "details": {
                "vial_amount_mcg": vial_amount_mcg,
                "concentration_mcg_ml": round(concentration_mcg_ml, 2),
                "volume_ml": round(volume_ml, 4)
            }
        }
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/peptides", response_model=Peptide)
async def create_peptide(data: PeptideCreate):
    try:
        # Calculate the IU
        calculation = PeptideCalculation(
            vial_amount_mg=data.vial_amount_mg,
            bac_water_ml=data.bac_water_ml,
            dose_mcg=data.dose_mcg
        )
        calculated_iu = calculation.calculate_iu()
        
        # Create the peptide with the calculated IU
        peptide_data = data.dict()
        peptide_data["calculated_iu"] = calculated_iu
        
        peptide = Peptide(**peptide_data)
        peptide_dict = json.loads(json.dumps(peptide.dict(), cls=DateTimeEncoder))
        
        await db.peptides.insert_one(peptide_dict)
        return peptide
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/peptides", response_model=List[Peptide])
async def get_peptides(limit: int = 100, skip: int = 0):
    peptides = await db.peptides.find().sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return [Peptide(**peptide) for peptide in peptides]

@api_router.get("/peptides/{peptide_id}", response_model=Peptide)
async def get_peptide(peptide_id: str):
    peptide = await db.peptides.find_one({"id": peptide_id})
    if not peptide:
        raise HTTPException(status_code=404, detail="Peptide not found")
    return Peptide(**peptide)

@api_router.put("/peptides/{peptide_id}", response_model=Peptide)
async def update_peptide(peptide_id: str, data: PeptideCreate):
    peptide = await db.peptides.find_one({"id": peptide_id})
    if not peptide:
        raise HTTPException(status_code=404, detail="Peptide not found")
    
    # Calculate new IU
    calculation = PeptideCalculation(
        vial_amount_mg=data.vial_amount_mg,
        bac_water_ml=data.bac_water_ml,
        dose_mcg=data.dose_mcg
    )
    calculated_iu = calculation.calculate_iu()
    
    updated_peptide = Peptide(**peptide)
    update_data = data.dict(exclude_unset=True)
    
    # Update the fields
    for field, value in update_data.items():
        setattr(updated_peptide, field, value)
    
    # Update calculated IU and timestamp
    updated_peptide.calculated_iu = calculated_iu
    updated_peptide.updated_at = datetime.utcnow()
    
    await db.peptides.replace_one({"id": peptide_id}, json.loads(json.dumps(updated_peptide.dict(), cls=DateTimeEncoder)))
    return updated_peptide

@api_router.delete("/peptides/{peptide_id}")
async def delete_peptide(peptide_id: str):
    result = await db.peptides.delete_one({"id": peptide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Peptide not found")
    return {"detail": "Peptide deleted successfully"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Health Tracking API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()