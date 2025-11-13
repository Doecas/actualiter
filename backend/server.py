from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import shutil
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Créer le dossier pour les uploads
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    color: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: str
    color: str

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author: str
    category_id: str
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    published: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ArticleCreate(BaseModel):
    title: str
    content: str
    author: str
    category_id: str
    image_url: Optional[str] = None
    published: bool = False

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    published: Optional[bool] = None

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article_id: str
    author: str
    content: str
    approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    article_id: str
    author: str
    content: str

# Routes pour les catégories
@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category_dict = input.model_dump()
    category_obj = Category(**category_dict)
    doc = category_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return {"message": "Catégorie supprimée avec succès"}

# Routes pour les articles
@api_router.post("/articles", response_model=Article)
async def create_article(input: ArticleCreate):
    article_dict = input.model_dump()
    article_obj = Article(**article_dict)
    
    # Get category name
    category = await db.categories.find_one({"id": article_obj.category_id}, {"_id": 0})
    if category:
        article_obj.category_name = category['name']
    
    doc = article_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.articles.insert_one(doc)
    return article_obj

@api_router.get("/articles", response_model=List[Article])
async def get_articles(
    category_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    published_only: bool = Query(False)
):
    query = {}
    if category_id:
        query['category_id'] = category_id
    if published_only:
        query['published'] = True
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'content': {'$regex': search, '$options': 'i'}}
        ]
    
    articles = await db.articles.find(query, {"_id": 0}).sort('created_at', -1).to_list(1000)
    for article in articles:
        if isinstance(article['created_at'], str):
            article['created_at'] = datetime.fromisoformat(article['created_at'])
        if isinstance(article['updated_at'], str):
            article['updated_at'] = datetime.fromisoformat(article['updated_at'])
    return articles

@api_router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if isinstance(article['created_at'], str):
        article['created_at'] = datetime.fromisoformat(article['created_at'])
    if isinstance(article['updated_at'], str):
        article['updated_at'] = datetime.fromisoformat(article['updated_at'])
    return article

@api_router.put("/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, input: ArticleUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Get category name if category_id is being updated
    if 'category_id' in update_data:
        category = await db.categories.find_one({"id": update_data['category_id']}, {"_id": 0})
        if category:
            update_data['category_name'] = category['name']
    
    result = await db.articles.update_one(
        {"id": article_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    article = await db.articles.find_one({"id": article_id}, {"_id": 0})
    if isinstance(article['created_at'], str):
        article['created_at'] = datetime.fromisoformat(article['created_at'])
    if isinstance(article['updated_at'], str):
        article['updated_at'] = datetime.fromisoformat(article['updated_at'])
    return article

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str):
    result = await db.articles.delete_one({"id": article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    # Delete associated comments
    await db.comments.delete_many({"article_id": article_id})
    return {"message": "Article supprimé avec succès"}

# Routes pour les commentaires
@api_router.post("/comments", response_model=Comment)
async def create_comment(input: CommentCreate):
    comment_dict = input.model_dump()
    comment_obj = Comment(**comment_dict)
    doc = comment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.comments.insert_one(doc)
    return comment_obj

@api_router.get("/comments/{article_id}", response_model=List[Comment])
async def get_comments(article_id: str, approved_only: bool = Query(False)):
    query = {"article_id": article_id}
    if approved_only:
        query['approved'] = True
    
    comments = await db.comments.find(query, {"_id": 0}).sort('created_at', -1).to_list(1000)
    for comment in comments:
        if isinstance(comment['created_at'], str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
    return comments

@api_router.put("/comments/{comment_id}/approve")
async def approve_comment(comment_id: str):
    result = await db.comments.update_one(
        {"id": comment_id},
        {"$set": {"approved": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Commentaire non trouvé")
    return {"message": "Commentaire approuvé"}

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    result = await db.comments.delete_one({"id": comment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Commentaire non trouvé")
    return {"message": "Commentaire supprimé avec succès"}

# Route pour l'upload d'images
@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Optimize image
    try:
        img = Image.open(file_path)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        img.save(file_path, optimize=True, quality=85)
    except Exception as e:
        logging.error(f"Error optimizing image: {e}")
    
    return {"url": f"/api/uploads/{unique_filename}"}

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    return FileResponse(file_path)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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