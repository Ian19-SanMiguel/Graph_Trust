
# main.py

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import networkx as nx 
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

app = FastAPI(title="GraphTrust API")

# Global in-memory graph to simulate marketplace activity
marketplace_graph = nx.Graph()

# --- Pydantic Schemas ---
class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    user_type: str

class KYCSubmission(BaseModel):
    user_id: int
    doc_url: str
    selfie_url: str

class CartItem(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    buyer_id: int
    items: List[CartItem]

class ReviewSubmit(BaseModel):
    buyer_id: int
    seller_id: int
    product_id: int
    order_item_id: int
    rating: float
    comment: str

# --- 1. FEATURE EXTRACTION FOR MACHINE LEARNING ---
def extract_graph_features(G, user_id):
    """
    Translates the graph structure into numbers the ML model can understand.
    Returns: [total_connections, num_devices_shared, connections_to_scammers]
    """
    if user_id not in G:
        return np.array([[0, 0, 0]]) # No data yet
        
    total_connections = G.degree(user_id)
    
    # Count how many devices this user shares
    shared_devices = sum(1 for neighbor in G.neighbors(user_id) if "Device" in str(neighbor))
    
    # Count connections to known scammers (Simulated)
    scammer_connections = sum(1 for neighbor in G.neighbors(user_id) if "Scammer" in str(neighbor))
    
    return np.array([[total_connections, shared_devices, scammer_connections]])


# --- 2. TRAINABLE ML ENGINE ---
@app.post("/admin/train-model")
async def train_trust_model():
    """
    Generates historical synthetic data, extracts features, trains the AI, and saves it.
    """
    # Create a synthetic dataset
    X_train = [] # Features
    y_train = [] # Labels (Historical Trust Scores)
    
    # Generate 100 fake users to train on
    for i in range(100):
        conns = np.random.randint(1, 50)
        devices = np.random.randint(1, 5)
        scammer_links = np.random.randint(0, 3)
        
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
def calculate_trust_score(user_id: int) -> float:
    """
    Uses the trained ML model to predict the Trust Score instead of hardcoded rules.
    """
    # Ensure model exists
    if not os.path.exists("graphtrust_model.pkl"):
        return 2.5 # Default score if AI hasn't been trained yet
        
    # Load the trained model
    model = joblib.load("graphtrust_model.pkl")
    
    # Extract real-time features from the Graph
    features = extract_graph_features(marketplace_graph, user_id)
    
    # Make a prediction
    predicted_score = model.predict(features)[0]
    
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
    marketplace_graph.add_edge(submission.user_id, f"Device_IP_{submission.user_id}")

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
    marketplace_graph.add_edge(review.buyer_id, review.seller_id, interaction="review")
    
    return {"status": "success", "message": "Review submitted successfully and logged for Graph Analysis."}

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


# Run the Server 

if __name__ == "__main__":
    import uvicorn
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    await server.serve()