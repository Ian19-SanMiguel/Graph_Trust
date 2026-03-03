
# main.py

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import networkx as nx 
import random
import os
import sqlite3
import json
from datetime import datetime, timezone

try:
    import firebase_admin
    from firebase_admin import credentials, firestore as firebase_firestore
except ImportError:
    firebase_admin = None
    credentials = None
    firebase_firestore = None

try:
    import numpy as np
except ImportError:
    np = None

try:
    from sklearn.ensemble import RandomForestRegressor
except ImportError:
    RandomForestRegressor = None

try:
    import joblib
except ImportError:
    joblib = None

app = FastAPI(title="GraphTrust API")

# Global in-memory graph to simulate marketplace activity
marketplace_graph = nx.Graph()
DB_PATH = os.path.join(os.path.dirname(__file__), "graphtrust.db")
GRAPH_STORE_BACKEND = os.getenv("GRAPH_STORE_BACKEND", "firestore").strip().lower()
FIRESTORE_COLLECTION = os.getenv("AI_GRAPH_EDGES_COLLECTION", "ai_graph_edges").strip()
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "").strip()
FIREBASE_CREDENTIALS_PATH = (
    os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
    or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
)

graph_store_in_use = "sqlite"
firestore_db = None


def _get_db_connection():
    return sqlite3.connect(DB_PATH)


def init_firestore():
    global firestore_db, graph_store_in_use

    if firebase_admin is None or firebase_firestore is None:
        raise RuntimeError("firebase-admin is not installed")

    init_kwargs = {}
    if FIREBASE_PROJECT_ID:
        init_kwargs["projectId"] = FIREBASE_PROJECT_ID

    if not firebase_admin._apps:
        if FIREBASE_CREDENTIALS_PATH:
            if not os.path.exists(FIREBASE_CREDENTIALS_PATH):
                raise RuntimeError(f"FIREBASE_CREDENTIALS_PATH not found: {FIREBASE_CREDENTIALS_PATH}")
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, init_kwargs or None)
        else:
            firebase_admin.initialize_app(options=init_kwargs or None)

    firestore_db = firebase_firestore.client()
    graph_store_in_use = "firestore"


def init_graph_db():
    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS graph_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                target TEXT NOT NULL,
                relation TEXT NOT NULL,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def persist_graph_edge(source: str, target: str, relation: str, metadata: Optional[dict] = None):
    if graph_store_in_use == "firestore" and firestore_db is not None:
        payload = {
            "source": str(source),
            "target": str(target),
            "relation": relation,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        firestore_db.collection(FIRESTORE_COLLECTION).add(payload)
        return

    payload = json.dumps(metadata or {})
    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO graph_edges (source, target, relation, metadata) VALUES (?, ?, ?, ?)",
            (str(source), str(target), relation, payload),
        )
        conn.commit()


def load_graph_from_store():
    marketplace_graph.clear()

    if graph_store_in_use == "firestore" and firestore_db is not None:
        docs = firestore_db.collection(FIRESTORE_COLLECTION).stream()
        for doc in docs:
            data = doc.to_dict() or {}
            source = str(data.get("source", "")).strip()
            target = str(data.get("target", "")).strip()
            relation = str(data.get("relation", "")).strip()
            metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}

            if not source or not target or not relation:
                continue

            edge_data = {"relation": relation}
            edge_data.update(metadata)
            marketplace_graph.add_edge(source, target, **edge_data)
        return

    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT source, target, relation, metadata FROM graph_edges ORDER BY id ASC")
        rows = cursor.fetchall()

    for source, target, relation, metadata in rows:
        edge_data = {"relation": relation}
        try:
            parsed_meta = json.loads(metadata or "{}")
            if isinstance(parsed_meta, dict):
                edge_data.update(parsed_meta)
        except json.JSONDecodeError:
            pass

        marketplace_graph.add_edge(source, target, **edge_data)


@app.on_event("startup")
async def startup_event():
    global graph_store_in_use

    if GRAPH_STORE_BACKEND == "firestore":
        try:
            init_firestore()
            print("Graph store initialized with Firestore")
        except Exception as error:
            graph_store_in_use = "sqlite"
            print(f"Firestore graph store unavailable, falling back to SQLite: {error}")

    if graph_store_in_use == "sqlite":
        init_graph_db()
        print("Graph store initialized with SQLite")

    load_graph_from_store()

# --- Pydantic Schemas ---
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    user_type: str

class KYCSubmission(BaseModel):
    user_id: str
    doc_url: str
    selfie_url: str

class CartItem(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    buyer_id: int
    items: List[CartItem]

class ReviewSubmit(BaseModel):
    buyer_id: str
    seller_id: str
    product_id: str
    order_item_id: str
    rating: float
    comment: str

class TrustRescoreRequest(BaseModel):
    user_id: str

# --- 1. FEATURE EXTRACTION FOR MACHINE LEARNING ---
def extract_graph_features(G, user_id):
    """
    Translates the graph structure into numbers the ML model can understand.
    Returns: [total_connections, num_devices_shared, connections_to_scammers]
    """
    if user_id not in G:
        return [0, 0, 0] # No data yet
        
    total_connections = G.degree(user_id)
    
    # Count how many devices this user shares
    shared_devices = sum(1 for neighbor in G.neighbors(user_id) if "Device" in str(neighbor))
    
    # Count connections to known scammers (Simulated)
    scammer_connections = sum(1 for neighbor in G.neighbors(user_id) if "Scammer" in str(neighbor))
    
    return [total_connections, shared_devices, scammer_connections]


# --- 2. TRAINABLE ML ENGINE ---
@app.post("/admin/train-model")
async def train_trust_model():
    """
    Generates historical synthetic data, extracts features, trains the AI, and saves it.
    """
    if RandomForestRegressor is None or joblib is None:
        return {
            "message": "ML dependencies not installed. Using fallback trust scoring.",
            "fallback": True,
        }

    # Create a synthetic dataset
    X_train = [] # Features
    y_train = [] # Labels (Historical Trust Scores)
    
    # Generate 100 fake users to train on
    for i in range(100):
        conns = random.randint(1, 49)
        devices = random.randint(1, 4)
        scammer_links = random.randint(0, 2)
        
        # Determine historical score based on logic (the AI will learn this pattern)
        # High scammers = low score. High normal connections = good score.
        score = 5.0 - (scammer_links * 1.5) - (devices * 0.2) + (conns * 0.01)
        score = max(0.0, min(5.0, score)) # Keep between 0 and 5
        
        X_train.append([conns, devices, scammer_links])
        y_train.append(score)
        
    # Train the Machine Learning Model
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    
    # Save the trained model to disk
    joblib.dump(model, "graphtrust_model.pkl")
    
    return {"message": "Model trained successfully on 100 records and saved to disk."}


# --- 3. PREDICTIVE SCORING ---
def calculate_trust_score(user_id: str) -> float:
    """
    Uses the trained ML model to predict the Trust Score instead of hardcoded rules.
    """
    features = extract_graph_features(marketplace_graph, user_id)
    total_connections, shared_devices, scammer_connections = features

    if (
        np is None
        or RandomForestRegressor is None
        or joblib is None
        or not os.path.exists("graphtrust_model.pkl")
    ):
        fallback_score = 2.5 + (total_connections * 0.03) - (shared_devices * 0.2) - (scammer_connections * 1.5)
        return round(max(0.0, min(5.0, fallback_score)), 2)

    model = joblib.load("graphtrust_model.pkl")
    predicted_score = model.predict([features])[0]
    return round(float(predicted_score), 2)


# --- API Endpoints ---
@app.post("/auth/signup")
async def register_user(user: UserSignup):
    marketplace_graph.add_node(user.name) # Add to graph
    return {"status": "success", "message": "User registered. Please complete KYC."}

@app.post("/kyc/upload")
async def upload_kyc_documents(submission: KYCSubmission):
    ai_verified = True 
    
    # Link user to a device in the graph to simulate behavior
    device_node = f"Device_IP_{submission.user_id}"
    marketplace_graph.add_edge(submission.user_id, device_node, relation="device_link")
    persist_graph_edge(submission.user_id, device_node, "device_link")

    if ai_verified:
        new_status = "Verified"
        # Calculate Trust Score using the TRAINED AI
        new_trust_score = calculate_trust_score(submission.user_id)
    else:
        new_status = "Manual Review"
        new_trust_score = 1.0

    return {
        "kyc_status": new_status,
        "trust_score": new_trust_score,
        "message": "Documents processed."
    }

@app.post("/orders/checkout")
async def checkout_order(order: OrderCreate):
    return {"status": "success", "order_id": 9982, "message": "Order placed successfully."}

@app.post("/reviews/submit")
async def submit_review(review: ReviewSubmit):
    simulated_db_order_status = "Delivered"

    if simulated_db_order_status != "Delivered":
        raise HTTPException(status_code=403, detail="Reviews can only be submitted for items that have been Delivered.")
    
    # Add review interaction to the Graph
    review_meta = {
        "interaction": "review",
        "rating": float(review.rating),
        "product_id": review.product_id,
        "order_item_id": review.order_item_id,
    }
    marketplace_graph.add_edge(review.buyer_id, review.seller_id, relation="review", **review_meta)
    persist_graph_edge(review.buyer_id, review.seller_id, "review", review_meta)
    
    return {"status": "success", "message": "Review submitted successfully and logged for Graph Analysis."}

@app.post("/trust/recalculate")
async def recalculate_trust_score(payload: TrustRescoreRequest):
    trust_score = calculate_trust_score(payload.user_id)
    return {
        "user_id": payload.user_id,
        "trust_score": trust_score,
        "message": "Trust score recalculated successfully."
    }

@app.get("/admin/risk-dashboard")
async def get_risk_dashboard():
    return {
        "high_risk_users": [
            {"user_id": 101, "reason": "Shared IP with banned account", "risk_level": "High"},
        ],
        "stats": {
            "safe_transactions": 1467,
            "avg_trust_score": 4.6
        }
    }


@app.get("/admin/graph-store-status")
async def graph_store_status():
    return {
        "store": graph_store_in_use,
        "nodes": marketplace_graph.number_of_nodes(),
        "edges": marketplace_graph.number_of_edges(),
        "firestore_collection": FIRESTORE_COLLECTION if graph_store_in_use == "firestore" else None,
    }


# Run the Server 

if __name__ == "__main__":
    import uvicorn
    # This works properly for local Windows/Mac deployment
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)