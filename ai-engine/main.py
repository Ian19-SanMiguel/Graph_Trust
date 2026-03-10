
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
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

# MultiDiGraph preserves repeated interactions as separate edges.
marketplace_graph = nx.MultiDiGraph()

DB_PATH = os.path.join(os.path.dirname(__file__), "graphtrust.db")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "graphtrust_model.pkl")
GRAPH_STORE_BACKEND = os.getenv("GRAPH_STORE_BACKEND", "firestore").strip().lower()
AI_ALLOW_SQLITE_FALLBACK = os.getenv("AI_ALLOW_SQLITE_FALLBACK", "false").strip().lower() in {
    "1",
    "true",
    "yes",
}
FIRESTORE_EDGES_COLLECTION = os.getenv("AI_GRAPH_EDGES_COLLECTION", "ai_graph_edges").strip()
FIRESTORE_ALERTS_COLLECTION = os.getenv("AI_GRAPH_ALERTS_COLLECTION", "ai_graph_alerts").strip()
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "").strip()
FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
FIREBASE_CREDENTIALS_PATH = (
    os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
    or os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
)

HIGH_RISK_THRESHOLD = float(os.getenv("AI_HIGH_RISK_THRESHOLD", "70"))
AI_ALLOW_TRUST_FORMULA_FALLBACK = os.getenv("AI_ALLOW_TRUST_FORMULA_FALLBACK", "false").strip().lower() in {
    "1",
    "true",
    "yes",
}
AI_TRUST_REQUIRE_ML = os.getenv("AI_TRUST_REQUIRE_ML", "true").strip().lower() in {
    "1",
    "true",
    "yes",
}

graph_store_in_use = "uninitialized"
firestore_db = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_db_connection():
    return sqlite3.connect(DB_PATH)


def normalize_user_node(user_id: str) -> str:
    return f"user:{str(user_id).strip()}"


def normalize_order_node(order_id: str) -> str:
    return f"order:{str(order_id).strip()}"


def normalize_product_node(product_id: str) -> str:
    return f"product:{str(product_id).strip()}"


def normalize_review_node(review_id: str) -> str:
    return f"review:{str(review_id).strip()}"


def normalize_report_node(report_id: str) -> str:
    return f"report:{str(report_id).strip()}"


def normalize_identity_node(marker_type: str, marker_value: str) -> str:
    return f"identity:{str(marker_type).strip().lower()}:{str(marker_value).strip()}"


def add_node(node_id: str, node_type: str):
    marketplace_graph.add_node(node_id, node_type=node_type)


def init_firestore():
    global firestore_db, graph_store_in_use

    if firebase_admin is None or firebase_firestore is None:
        raise RuntimeError("firebase-admin is not installed")

    init_kwargs = {}
    if FIREBASE_PROJECT_ID:
        init_kwargs["projectId"] = FIREBASE_PROJECT_ID

    if not firebase_admin._apps:
        if FIREBASE_SERVICE_ACCOUNT_JSON:
            service_account_info = json.loads(FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred, init_kwargs or None)
        elif FIREBASE_CREDENTIALS_PATH:
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
                edge_id TEXT,
                source TEXT NOT NULL,
                target TEXT NOT NULL,
                relation TEXT NOT NULL,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS graph_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                risk_score REAL NOT NULL,
                reason TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # Backward compatibility migration for older local SQLite stores.
        cursor.execute("PRAGMA table_info(graph_edges)")
        edge_columns = {row[1] for row in cursor.fetchall()}
        if "edge_id" not in edge_columns:
            cursor.execute("ALTER TABLE graph_edges ADD COLUMN edge_id TEXT")

        conn.commit()


def persist_graph_edge(source: str, target: str, relation: str, metadata: Optional[dict] = None):
    metadata = metadata or {}
    edge_id = str(metadata.get("edge_id") or f"{relation}:{source}:{target}:{now_iso()}")

    if graph_store_in_use == "firestore" and firestore_db is not None:
        payload = {
            "edge_id": edge_id,
            "source": str(source),
            "target": str(target),
            "relation": relation,
            "metadata": metadata,
            "created_at": now_iso(),
        }
        firestore_db.collection(FIRESTORE_EDGES_COLLECTION).add(payload)
        return

    payload = json.dumps(metadata)
    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO graph_edges (edge_id, source, target, relation, metadata) VALUES (?, ?, ?, ?, ?)",
            (edge_id, str(source), str(target), relation, payload),
        )
        conn.commit()


def persist_alert(user_id: str, risk_score: float, reason: str):
    payload = {
        "user_id": str(user_id),
        "risk_score": float(risk_score),
        "reason": str(reason),
        "created_at": now_iso(),
    }

    if graph_store_in_use == "firestore" and firestore_db is not None:
        firestore_db.collection(FIRESTORE_ALERTS_COLLECTION).add(payload)
        return

    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO graph_alerts (user_id, risk_score, reason, created_at) VALUES (?, ?, ?, ?)",
            (payload["user_id"], payload["risk_score"], payload["reason"], payload["created_at"]),
        )
        conn.commit()


def load_alerts(limit: int = 50):
    if graph_store_in_use == "firestore" and firestore_db is not None:
        docs = firestore_db.collection(FIRESTORE_ALERTS_COLLECTION).limit(limit).stream()
        alerts = []
        for doc in docs:
            data = doc.to_dict() or {}
            alerts.append(
                {
                    "user_id": str(data.get("user_id", "")),
                    "risk_score": float(data.get("risk_score", 0.0) or 0.0),
                    "reason": str(data.get("reason", "")),
                    "created_at": data.get("created_at"),
                }
            )
        return alerts

    with _get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, risk_score, reason, created_at FROM graph_alerts ORDER BY id DESC LIMIT ?",
            (int(limit),),
        )
        rows = cursor.fetchall()
    return [
        {
            "user_id": row[0],
            "risk_score": float(row[1] or 0.0),
            "reason": row[2],
            "created_at": row[3],
        }
        for row in rows
    ]


def add_graph_edge(source: str, target: str, relation: str, metadata: Optional[dict] = None):
    metadata = metadata or {}
    edge_id = str(metadata.get("edge_id") or f"{relation}:{source}:{target}:{now_iso()}")
    metadata["edge_id"] = edge_id
    metadata.setdefault("created_at", now_iso())
    marketplace_graph.add_edge(source, target, key=edge_id, relation=relation, **metadata)
    persist_graph_edge(source, target, relation, metadata)


def load_graph_from_store():
    marketplace_graph.clear()

    if graph_store_in_use == "firestore" and firestore_db is not None:
        docs = firestore_db.collection(FIRESTORE_EDGES_COLLECTION).stream()
        for doc in docs:
            data = doc.to_dict() or {}
            source = str(data.get("source", "")).strip()
            target = str(data.get("target", "")).strip()
            relation = str(data.get("relation", "")).strip()
            metadata = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
            edge_id = str(data.get("edge_id") or metadata.get("edge_id") or f"{relation}:{source}:{target}:{now_iso()}")

            if not source or not target or not relation:
                continue

            marketplace_graph.add_edge(source, target, key=edge_id, relation=relation, **metadata)
        return

    with _get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT edge_id, source, target, relation, metadata FROM graph_edges ORDER BY id ASC")
            rows = cursor.fetchall()
        except sqlite3.OperationalError:
            # Legacy schema fallback (before edge_id column was introduced).
            cursor.execute("SELECT source, target, relation, metadata FROM graph_edges ORDER BY id ASC")
            legacy_rows = cursor.fetchall()
            rows = [(None, source, target, relation, metadata) for source, target, relation, metadata in legacy_rows]

    for edge_id, source, target, relation, metadata in rows:
        edge_data = {}
        try:
            parsed_meta = json.loads(metadata or "{}")
            if isinstance(parsed_meta, dict):
                edge_data.update(parsed_meta)
        except json.JSONDecodeError:
            pass

        key = str(edge_id or edge_data.get("edge_id") or f"{relation}:{source}:{target}:{now_iso()}")
        marketplace_graph.add_edge(source, target, key=key, relation=relation, **edge_data)


def ml_dependencies_ready() -> bool:
    return np is not None and RandomForestRegressor is not None and joblib is not None


def train_model_file() -> bool:
    if not ml_dependencies_ready():
        return False

    x_train = []
    y_train = []

    for _ in range(250):
        total_connections = random.randint(1, 80)
        identity_connections = random.randint(0, 8)
        shared_identity_count = random.randint(0, 5)
        unique_counterparties = random.randint(0, 40)
        low_rating_ratio = random.random()
        report_signal_count = random.randint(0, 10)

        risk = (
            shared_identity_count * 14
            + max(0, identity_connections - 2) * 5
            + low_rating_ratio * 20
            + report_signal_count * 5
            + max(0, 15 - unique_counterparties) * 1.2
            + max(0, total_connections - 60) * 0.6
        )
        risk = max(0.0, min(100.0, risk))
        trust_score = max(0.0, min(5.0, 5.0 - (risk / 20.0)))

        x_train.append(
            [
                total_connections,
                identity_connections,
                shared_identity_count,
                unique_counterparties,
                low_rating_ratio,
                report_signal_count,
            ]
        )
        y_train.append(trust_score)

    model = RandomForestRegressor(n_estimators=80, random_state=42)
    model.fit(x_train, y_train)
    joblib.dump(model, MODEL_PATH)
    return True


def ensure_ml_model_ready() -> bool:
    if os.path.exists(MODEL_PATH) and ml_dependencies_ready():
        return True

    trained = train_model_file()
    return trained and os.path.exists(MODEL_PATH)


@app.on_event("startup")
async def startup_event():
    global graph_store_in_use

    if GRAPH_STORE_BACKEND == "firestore":
        try:
            init_firestore()
            print("Graph store initialized with Firestore")
        except Exception as error:
            if AI_ALLOW_SQLITE_FALLBACK:
                graph_store_in_use = "sqlite"
                init_graph_db()
                print(f"Firestore graph store unavailable, fallback to SQLite enabled: {error}")
            else:
                raise RuntimeError(
                    "Firestore graph store initialization failed. "
                    "Set FIREBASE_PROJECT_ID/credentials correctly, or explicitly opt into local mode with "
                    "GRAPH_STORE_BACKEND=sqlite (or AI_ALLOW_SQLITE_FALLBACK=true)."
                ) from error

    elif GRAPH_STORE_BACKEND == "sqlite":
        init_graph_db()
        graph_store_in_use = "sqlite"
        print("Graph store initialized with SQLite")
    else:
        raise RuntimeError(
            f"Unsupported GRAPH_STORE_BACKEND '{GRAPH_STORE_BACKEND}'. Use 'firestore' or 'sqlite'."
        )

    load_graph_from_store()

    if AI_TRUST_REQUIRE_ML and not AI_ALLOW_TRUST_FORMULA_FALLBACK:
        if not ensure_ml_model_ready():
            raise RuntimeError(
                "AI trust scoring requires ML model, but model could not be prepared. "
                "Install ML dependencies or explicitly allow formula fallback with "
                "AI_ALLOW_TRUST_FORMULA_FALLBACK=true."
            )


class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    user_type: str


class KYCSubmission(BaseModel):
    user_id: str
    doc_url: str
    selfie_url: str
    identity_markers: Optional[Dict[str, str]] = None


class CartItem(BaseModel):
    product_id: str
    quantity: int
    seller_id: Optional[str] = None


class OrderCreate(BaseModel):
    buyer_id: str
    order_id: str = Field(default_factory=lambda: f"order-{int(datetime.now().timestamp())}")
    items: List[CartItem]
    total_amount: Optional[float] = 0.0
    identity_markers: Optional[Dict[str, str]] = None


class ReviewSubmit(BaseModel):
    buyer_id: str
    seller_id: str
    product_id: str
    order_item_id: str
    rating: float
    comment: str


class TrustRescoreRequest(BaseModel):
    user_id: str


class IdentityLinkEvent(BaseModel):
    user_id: str
    marker_type: str
    marker_value: str


class ReportSignalEvent(BaseModel):
    user_id: str
    report_id: str
    target_type: str
    target_id: str
    reasons: List[str] = []


def get_user_nodes() -> List[str]:
    return [node for node, data in marketplace_graph.nodes(data=True) if data.get("node_type") == "user"]


def get_identity_nodes() -> List[str]:
    return [node for node, data in marketplace_graph.nodes(data=True) if data.get("node_type") == "identity"]


def build_user_projection() -> nx.Graph:
    projected = nx.Graph()
    users = get_user_nodes()
    projected.add_nodes_from(users)

    # Shared identity markers.
    for identity in get_identity_nodes():
        neighbors = [n for n in marketplace_graph.neighbors(identity) if str(n).startswith("user:")]
        for i in range(len(neighbors)):
            for j in range(i + 1, len(neighbors)):
                a, b = neighbors[i], neighbors[j]
                existing_weight = projected.get_edge_data(a, b, {}).get("weight", 0)
                projected.add_edge(a, b, weight=existing_weight + 2, relation="shared_identity")

    # Direct behavioral interactions.
    for u, v, edge_data in marketplace_graph.edges(data=True):
        if str(u).startswith("user:") and str(v).startswith("user:"):
            relation = str(edge_data.get("relation", ""))
            weight_bump = 1
            if relation in {"purchased_from", "review"}:
                weight_bump = 2
            existing_weight = projected.get_edge_data(u, v, {}).get("weight", 0)
            projected.add_edge(u, v, weight=existing_weight + weight_bump, relation="interaction")

    return projected


def run_link_analysis():
    user_projection = build_user_projection()

    repeated_interactions = []
    user_pair_counts = {}
    for source, target, edge_data in marketplace_graph.edges(data=True):
        if str(source).startswith("user:") and str(target).startswith("user:"):
            key = tuple(sorted([source, target]))
            user_pair_counts[key] = user_pair_counts.get(key, 0) + 1

    for pair, count in user_pair_counts.items():
        if count >= 3:
            repeated_interactions.append(
                {
                    "users": list(pair),
                    "interaction_count": count,
                    "signal": "repeated_buyer_seller_interaction",
                }
            )

    shared_identity_clusters = []
    for identity in get_identity_nodes():
        linked_users = [n for n in marketplace_graph.neighbors(identity) if str(n).startswith("user:")]
        if len(linked_users) >= 2:
            shared_identity_clusters.append(
                {
                    "identity": identity,
                    "users": linked_users,
                    "signal": "shared_identity_attribute",
                }
            )

    suspicious_clusters = []
    for component in nx.connected_components(user_projection):
        component_nodes = list(component)
        if len(component_nodes) < 3:
            continue

        subgraph = user_projection.subgraph(component_nodes)
        density = nx.density(subgraph)
        total_weight = sum(data.get("weight", 0) for _, _, data in subgraph.edges(data=True))
        if density >= 0.5 or total_weight >= (len(component_nodes) * 3):
            suspicious_clusters.append(
                {
                    "nodes": component_nodes,
                    "size": len(component_nodes),
                    "density": round(float(density), 4),
                    "total_weight": total_weight,
                }
            )

    return {
        "repeated_interactions": repeated_interactions,
        "shared_identity_clusters": shared_identity_clusters,
        "suspicious_clusters": suspicious_clusters,
    }


def extract_graph_features(user_id: str):
    node_id = normalize_user_node(user_id)
    if node_id not in marketplace_graph:
        return [0, 0, 0, 0, 0, 0]

    total_connections = marketplace_graph.degree(node_id)

    identity_connections = 0
    shared_identity_count = 0
    counterparties = set()
    review_count = 0
    low_rating_review_count = 0
    report_signal_count = 0

    for _, neighbor, edge_data in marketplace_graph.out_edges(node_id, data=True):
        relation = str(edge_data.get("relation", ""))
        if str(neighbor).startswith("identity:"):
            identity_connections += 1
            identity_neighbors = [n for n in marketplace_graph.neighbors(neighbor) if str(n).startswith("user:")]
            if len(identity_neighbors) > 1:
                shared_identity_count += 1

        if str(neighbor).startswith("user:"):
            counterparties.add(neighbor)

        if relation in {"review", "reviewed_seller"}:
            review_count += 1
            rating = float(edge_data.get("rating", 0.0) or 0.0)
            if rating <= 2.0:
                low_rating_review_count += 1

    for _, _, edge_data in marketplace_graph.in_edges(node_id, data=True):
        if str(edge_data.get("relation", "")) == "reported_user":
            report_signal_count += 1

    unique_counterparties = len(counterparties)
    low_rating_ratio = 0.0 if review_count == 0 else low_rating_review_count / review_count

    return [
        float(total_connections),
        float(identity_connections),
        float(shared_identity_count),
        float(unique_counterparties),
        float(low_rating_ratio),
        float(report_signal_count),
    ]


@app.post("/admin/train-model")
async def train_trust_model():
    if not ml_dependencies_ready():
        return {
            "message": "ML dependencies not installed. Using fallback trust scoring.",
            "fallback": True,
        }
    train_model_file()

    return {"message": "Model trained successfully on synthetic graph-derived behavior."}


def calculate_trust_score(user_id: str) -> float:
    features = extract_graph_features(user_id)

    ml_ready = ensure_ml_model_ready()
    if not ml_ready:
        if not AI_ALLOW_TRUST_FORMULA_FALLBACK:
            raise RuntimeError(
                "ML trust model is unavailable and formula fallback is disabled. "
                "Train model via /admin/train-model or enable AI_ALLOW_TRUST_FORMULA_FALLBACK=true."
            )

        (
            total_connections,
            identity_connections,
            shared_identity_count,
            unique_counterparties,
            low_rating_ratio,
            report_signal_count,
        ) = features
        risk = (
            shared_identity_count * 14
            + max(0.0, identity_connections - 2) * 5
            + (low_rating_ratio * 20)
            + report_signal_count * 5
            + max(0.0, 15 - unique_counterparties) * 1.2
            + max(0.0, total_connections - 60) * 0.6
        )
        risk = max(0.0, min(100.0, risk))
        return round(max(0.0, min(5.0, 5.0 - risk / 20.0)), 2)

    model = joblib.load(MODEL_PATH)
    predicted_score = model.predict([features])[0]
    return round(float(max(0.0, min(5.0, predicted_score))), 2)


def get_trust_scoring_mode() -> str:
    ml_ready = ml_dependencies_ready() and os.path.exists(MODEL_PATH)
    return "ml" if ml_ready else "fallback"


def calculate_risk_score(user_id: str):
    trust_score = calculate_trust_score(user_id)
    risk_score = round(max(0.0, min(100.0, (5.0 - trust_score) * 20.0)), 2)

    indicators = extract_graph_features(user_id)
    link_analysis = run_link_analysis()
    user_node = normalize_user_node(user_id)
    in_cluster = any(user_node in cluster["nodes"] for cluster in link_analysis["suspicious_clusters"])
    if in_cluster:
        risk_score = round(min(100.0, risk_score + 8.0), 2)

    reasons = []
    if indicators[2] >= 1:
        reasons.append("shared identity attributes detected")
    if indicators[4] >= 0.6:
        reasons.append("high low-rating review ratio")
    if indicators[5] >= 3:
        reasons.append("repeated reports against this user")
    if in_cluster:
        reasons.append("member of suspicious behavioral cluster")
    if not reasons:
        reasons.append("baseline network behavior")

    return {
        "user_id": user_id,
        "trust_score": round(max(0.0, min(5.0, 5.0 - (risk_score / 20.0))), 2),
        "risk_score": risk_score,
        "risk_level": "high" if risk_score >= 70 else ("medium" if risk_score >= 40 else "low"),
        "indicators": {
            "total_connections": indicators[0],
            "identity_connections": indicators[1],
            "shared_identity_connections": indicators[2],
            "unique_counterparties": indicators[3],
            "low_rating_ratio": round(indicators[4], 4),
            "report_signals": int(indicators[5]),
        },
        "reasons": reasons,
    }


def maybe_create_alert(user_id: str, risk_payload: dict):
    if float(risk_payload.get("risk_score", 0.0) or 0.0) < HIGH_RISK_THRESHOLD:
        return None

    reason = "; ".join(risk_payload.get("reasons", []))
    persist_alert(user_id, float(risk_payload["risk_score"]), reason)
    return {
        "user_id": user_id,
        "risk_score": risk_payload["risk_score"],
        "reason": reason,
        "threshold": HIGH_RISK_THRESHOLD,
    }


@app.post("/auth/signup")
async def register_user(user: UserSignup):
    user_node = normalize_user_node(user.name)
    add_node(user_node, "user")
    return {"status": "success", "message": "User registered. Please complete KYC."}


@app.post("/kyc/upload")
async def upload_kyc_documents(submission: KYCSubmission):
    user_node = normalize_user_node(submission.user_id)
    add_node(user_node, "user")

    default_identity = {"device": f"device-{submission.user_id}"}
    provided_identity = submission.identity_markers or {}
    identity_markers = {**default_identity, **provided_identity}

    for marker_type, marker_value in identity_markers.items():
        if not marker_value:
            continue
        identity_node = normalize_identity_node(marker_type, marker_value)
        add_node(identity_node, "identity")
        add_graph_edge(
            user_node,
            identity_node,
            "identity_link",
            {
                "marker_type": marker_type,
                "marker_value": str(marker_value),
            },
        )

    risk_payload = calculate_risk_score(submission.user_id)
    alert = maybe_create_alert(submission.user_id, risk_payload)

    return {
        "kyc_status": "Verified",
        "trust_score": risk_payload["trust_score"],
        "risk_score": risk_payload["risk_score"],
        "risk_level": risk_payload["risk_level"],
        "alert": alert,
        "message": "Documents processed and identity links recorded.",
    }


@app.post("/orders/checkout")
async def checkout_order(order: OrderCreate):
    buyer_node = normalize_user_node(order.buyer_id)
    order_node = normalize_order_node(order.order_id)
    add_node(buyer_node, "user")
    add_node(order_node, "order")

    add_graph_edge(
        buyer_node,
        order_node,
        "placed_order",
        {"order_id": order.order_id, "total_amount": float(order.total_amount or 0.0)},
    )

    sellers_seen = set()
    for item in order.items:
        product_node = normalize_product_node(item.product_id)
        add_node(product_node, "product")
        add_graph_edge(
            order_node,
            product_node,
            "contains_item",
            {
                "product_id": str(item.product_id),
                "quantity": int(item.quantity),
            },
        )

        if item.seller_id:
            seller_node = normalize_user_node(item.seller_id)
            add_node(seller_node, "user")
            sellers_seen.add(str(item.seller_id))
            add_graph_edge(
                order_node,
                seller_node,
                "sold_by",
                {"order_id": order.order_id},
            )
            add_graph_edge(
                buyer_node,
                seller_node,
                "purchased_from",
                {"order_id": order.order_id, "product_id": str(item.product_id)},
            )

    if order.identity_markers:
        for marker_type, marker_value in order.identity_markers.items():
            if not marker_value:
                continue
            identity_node = normalize_identity_node(marker_type, marker_value)
            add_node(identity_node, "identity")
            add_graph_edge(buyer_node, identity_node, "identity_link", {"marker_type": marker_type})
            for seller_id in sellers_seen:
                seller_node = normalize_user_node(seller_id)
                add_graph_edge(seller_node, identity_node, "identity_link", {"marker_type": marker_type})

    risk_payload = calculate_risk_score(order.buyer_id)
    alert = maybe_create_alert(order.buyer_id, risk_payload)

    return {
        "status": "success",
        "order_id": order.order_id,
        "risk": risk_payload,
        "alert": alert,
        "message": "Order placed and graph relationships recorded.",
    }


@app.post("/graph/events/identity")
async def link_identity_event(payload: IdentityLinkEvent):
    user_node = normalize_user_node(payload.user_id)
    identity_node = normalize_identity_node(payload.marker_type, payload.marker_value)
    add_node(user_node, "user")
    add_node(identity_node, "identity")
    add_graph_edge(
        user_node,
        identity_node,
        "identity_link",
        {"marker_type": payload.marker_type, "marker_value": payload.marker_value},
    )

    risk_payload = calculate_risk_score(payload.user_id)
    alert = maybe_create_alert(payload.user_id, risk_payload)

    return {
        "status": "success",
        "risk": risk_payload,
        "alert": alert,
        "message": "Identity marker linked.",
    }


@app.post("/graph/events/report")
async def report_signal_event(payload: ReportSignalEvent):
    user_node = normalize_user_node(payload.user_id)
    report_node = normalize_report_node(payload.report_id)
    target_node = normalize_identity_node(f"report_target_{payload.target_type}", payload.target_id)

    add_node(user_node, "user")
    add_node(report_node, "report")
    add_node(target_node, "identity")

    add_graph_edge(
        report_node,
        user_node,
        "reported_user",
        {
            "target_type": payload.target_type,
            "target_id": payload.target_id,
            "reasons_count": len(payload.reasons or []),
        },
    )
    add_graph_edge(
        report_node,
        target_node,
        "reported_target",
        {
            "target_type": payload.target_type,
            "target_id": payload.target_id,
        },
    )

    risk_payload = calculate_risk_score(payload.user_id)
    alert = maybe_create_alert(payload.user_id, risk_payload)

    return {
        "status": "success",
        "risk": risk_payload,
        "alert": alert,
        "message": "Report signal recorded for graph risk processing.",
    }


@app.post("/reviews/submit")
async def submit_review(review: ReviewSubmit):
    simulated_db_order_status = "Delivered"
    if simulated_db_order_status != "Delivered":
        raise HTTPException(status_code=403, detail="Reviews can only be submitted for delivered items.")

    buyer_node = normalize_user_node(review.buyer_id)
    seller_node = normalize_user_node(review.seller_id)
    product_node = normalize_product_node(review.product_id)
    review_node = normalize_review_node(review.order_item_id)

    add_node(buyer_node, "user")
    add_node(seller_node, "user")
    add_node(product_node, "product")
    add_node(review_node, "review")

    review_meta = {
        "interaction": "review",
        "rating": float(review.rating),
        "product_id": review.product_id,
        "order_item_id": review.order_item_id,
        "comment_length": len(str(review.comment or "")),
    }

    add_graph_edge(buyer_node, seller_node, "review", review_meta)
    add_graph_edge(buyer_node, review_node, "authored_review", review_meta)
    add_graph_edge(review_node, seller_node, "reviewed_seller", review_meta)
    add_graph_edge(review_node, product_node, "reviewed_product", review_meta)

    buyer_risk = calculate_risk_score(review.buyer_id)
    seller_risk = calculate_risk_score(review.seller_id)
    buyer_alert = maybe_create_alert(review.buyer_id, buyer_risk)
    seller_alert = maybe_create_alert(review.seller_id, seller_risk)

    return {
        "status": "success",
        "message": "Review submitted successfully and graph updated.",
        "buyer_risk": buyer_risk,
        "seller_risk": seller_risk,
        "alerts": [item for item in [buyer_alert, seller_alert] if item],
    }


@app.post("/trust/recalculate")
async def recalculate_trust_score(payload: TrustRescoreRequest):
    risk_payload = calculate_risk_score(payload.user_id)
    alert = maybe_create_alert(payload.user_id, risk_payload)
    return {
        "user_id": payload.user_id,
        "scoring_mode": get_trust_scoring_mode(),
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "trust_score": risk_payload["trust_score"],
        "risk_score": risk_payload["risk_score"],
        "risk_level": risk_payload["risk_level"],
        "reasons": risk_payload["reasons"],
        "alert": alert,
        "message": "Trust score recalculated successfully.",
    }


@app.get("/admin/link-analysis")
async def get_link_analysis():
    analysis = run_link_analysis()
    return {
        "analysis": analysis,
        "graph_stats": {
            "nodes": marketplace_graph.number_of_nodes(),
            "edges": marketplace_graph.number_of_edges(),
            "user_nodes": len(get_user_nodes()),
            "identity_nodes": len(get_identity_nodes()),
        },
    }


@app.get("/admin/risk-dashboard")
async def get_risk_dashboard():
    users = [node for node in get_user_nodes() if str(node).startswith("user:")]
    scored = []
    for user_node in users:
        user_id = user_node.split("user:", 1)[1]
        risk_payload = calculate_risk_score(user_id)
        scored.append(risk_payload)

    high_risk_users = [
        {
            "user_id": item["user_id"],
            "risk_score": item["risk_score"],
            "risk_level": item["risk_level"],
            "reasons": item["reasons"],
        }
        for item in scored
        if float(item.get("risk_score", 0.0) or 0.0) >= HIGH_RISK_THRESHOLD
    ]

    avg_risk = 0.0 if not scored else sum(item["risk_score"] for item in scored) / len(scored)
    avg_trust = 0.0 if not scored else sum(item["trust_score"] for item in scored) / len(scored)

    return {
        "high_risk_users": sorted(high_risk_users, key=lambda item: item["risk_score"], reverse=True),
        "suspicious_networks": run_link_analysis()["suspicious_clusters"],
        "recent_alerts": load_alerts(limit=30),
        "stats": {
            "total_users_scored": len(scored),
            "avg_risk_score": round(avg_risk, 2),
            "avg_trust_score": round(avg_trust, 2),
            "high_risk_threshold": HIGH_RISK_THRESHOLD,
            "total_graph_nodes": marketplace_graph.number_of_nodes(),
            "total_graph_edges": marketplace_graph.number_of_edges(),
        },
    }


@app.get("/admin/graph-store-status")
async def graph_store_status():
    relation_counts = {}
    for _, _, edge_data in marketplace_graph.edges(data=True):
        relation = str(edge_data.get("relation", "unknown"))
        relation_counts[relation] = relation_counts.get(relation, 0) + 1

    return {
        "configured_backend": GRAPH_STORE_BACKEND,
        "sqlite_fallback_enabled": AI_ALLOW_SQLITE_FALLBACK,
        "trust_formula_fallback_enabled": AI_ALLOW_TRUST_FORMULA_FALLBACK,
        "trust_ml_required": AI_TRUST_REQUIRE_ML,
        "store": graph_store_in_use,
        "trust_scoring_mode": get_trust_scoring_mode(),
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH),
        "nodes": marketplace_graph.number_of_nodes(),
        "edges": marketplace_graph.number_of_edges(),
        "relation_counts": relation_counts,
        "firestore_edges_collection": FIRESTORE_EDGES_COLLECTION if graph_store_in_use == "firestore" else None,
        "firestore_alerts_collection": FIRESTORE_ALERTS_COLLECTION if graph_store_in_use == "firestore" else None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)