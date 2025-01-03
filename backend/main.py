from fastapi import *
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import pandas as pd
import json
from pydantic import BaseModel
import sqlite3

app = FastAPI(
    prefix="/Cabana",
    title="Cabana API",
    tags=["Cabana API"],
    responses={404: {"message": "Not found"}},
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddPayment(BaseModel):
    amount: float
    istype: str
    method: str
    date: str
    booking_id: int = 1
    promotion_id: int = 1

class AddComment(BaseModel):
    rating: int
    comment: str
    booking_id: int = 1
    passenger_id: int = 1
    driver_id: int = 1

database_path = "cabana.db"
engine = sqlite3.connect(database_path)

@app.get("/", include_in_schema=False)
async def index():
    try:
        return RedirectResponse("/docs")
    except:
        return { "message": "Unable to connect" }

@app.post("/add/payment", tags=['Payment'])
async def add_pay(item: AddPayment):
    sql = f"""
        INSERT OR REPLACE INTO
            payments (
                payment_amount,
                payment_method,
                payment_date,
                booking_id,
                promotion_id
            )
        VALUES (
            {item.amount},
            '{item.method}',
            '{item.date}',
            {item.booking_id},
            {item.promotion_id}
        )
    """
    try:
        cursor = engine.cursor()
        cursor.execute(sql)
        engine.commit()
        last_id = cursor.lastrowid
        if item.method == 'debit/credit':
            cursor.execute(f"""
                INSERT INTO
                    paids (card_type, payment_id)
                VALUES ('{item.method}', {last_id})     
            """)
        engine.commit()
        return {'message': 'success', 'id': last_id}
    except Exception as e:
        return {'message': e, 'sql': sql}

@app.post("/add/comment", tags=['Review'])
async def add_comment(item: AddComment):
    sql = f"""
        INSERT INTO
            reviews (
                rating,
                comment,
                booking_id,
                passenger_id,
                driver_id
            )
        VALUES (
            {item.rating},
            '{item.comment}',
            '{item.booking_id}',
            {item.passenger_id},
            {item.driver_id}
        )
    """
    try:
        cursor = engine.cursor()
        cursor.execute(sql)
        engine.commit()
        last_id = cursor.lastrowid
        return {'message': 'success', 'id': last_id}
    except Exception as e:
        return {'message': e}
    
@app.get("/get/promotion", tags=["Promotion"])
async def get_promo(code: str, booking_id: int = None):
    sql = f"""
        SELECT 
            promotion_code AS promotion_code,
            discount AS discount,
            discount_type_id AS is_type
        FROM 
            promotions
        WHERE 
            promotion_code = '{code}'
    """
    df = pd.read_sql(sql, engine)
    res = df.to_json(orient='records')
    parsed = json.loads(res)
    if len(df) > 0:
        return {'message': 'success', 'data': parsed}
    else:
        return {'message': 'error', 'data': []}