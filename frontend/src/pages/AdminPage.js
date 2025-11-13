import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit, Eye, Home, Image as ImageIcon, Check, X, Bold, Italic, List, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    author: "",
    category_id: "",
    image_url: "",
    published: false
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    color: "#007FFF"
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchAllComments();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles`);
      setArticles(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchAllComments = async () => {
    try {
      const allComments = [];
      for (const article of articles) {
        const response = await axios.get(`${API}/comments/${article.id}`);
        allComments.push(...response.data.map(c => ({ ...c, article_title: article.title })));
      }
      setComments(allComments);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setArticleForm({ ...articleForm, image_url: response.data.url });
      toast.success("Image téléchargée avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du téléchargement de l'image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!articleForm.title || !articleForm.content || !articleForm.author || !articleForm.category_id) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      if (editingArticle) {
        await axios.put(`${API}/articles/${editingArticle.id}`, articleForm);
        toast.success("Article mis à jour avec succès");
      } else {
        await axios.post(`${API}/articles`, articleForm);
        toast.success("Article créé avec succès");
      }
      setIsArticleDialogOpen(false);
      setArticleForm({ title: "", content: "", author: "", category_id: "", image_url: "", published: false });
      setEditingArticle(null);
      fetchArticles();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la sauvegarde de l'article");
    }
  };

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      author: article.author,
      category_id: article.category_id,
      image_url: article.image_url || "",
      published: article.published
    });
    setIsArticleDialogOpen(true);
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article?")) return;
    
    try {
      await axios.delete(`${API}/articles/${id}`);
      toast.success("Article supprimé avec succès");
      fetchArticles();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name || !categoryForm.description) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await axios.post(`${API}/categories`, categoryForm);
      toast.success("Catégorie créée avec succès");
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: "", description: "", color: "#007FFF" });
      fetchCategories();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la création de la catégorie");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie?")) return;
    
    try {
      await axios.delete(`${API}/categories/${id}`);
      toast.success("Catégorie supprimée avec succès");
      fetchCategories();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleApproveComment = async (id) => {
    try {
      await axios.put(`${API}/comments/${id}/approve`);
      toast.success("Commentaire approuvé");
      fetchAllComments();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire?")) return;
    
    try {
      await axios.delete(`${API}/comments/${id}`);
      toast.success("Commentaire supprimé");
      fetchAllComments();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const insertFormatting = (tag) => {
    const textarea = document.getElementById('content-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleForm.content.substring(start, end);
    
    let newText = '';
    switch(tag) {
      case 'bold':
        newText = `<strong>${selectedText || 'texte en gras'}</strong>`;
        break;
      case 'italic':
        newText = `<em>${selectedText || 'texte en italique'}</em>`;
        break;
      case 'h2':
        newText = `<h2>${selectedText || 'Titre'}</h2>`;
        break;
      case 'ul':
        newText = `<ul><li>${selectedText || 'élément de liste'}</li></ul>`;
        break;
      case 'link':
        const url = prompt('URL du lien:');
        if (url) newText = `<a href="${url}">${selectedText || 'lien'}</a>`;
        break;
      case 'p':
        newText = `<p>${selectedText || 'paragraphe'}</p>`;
        break;
    }
    
    if (newText) {
      const before = articleForm.content.substring(0, start);
      const after = articleForm.content.substring(end);
      setArticleForm({ ...articleForm, content: before + newText + after });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#007FFF] via-[#0066CC] to-[#004C99] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#CE1126] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">RDC</span>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Administration</h1>
                <p className="text-blue-100 text-sm mt-1">Gestion du blog E-Page Congo</p>
              </div>
            </div>
            <Link to="/" data-testid="home-link">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Home className="w-5 h-5 mr-2" />
                Accueil
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="articles" data-testid="articles-tab">Articles</TabsTrigger>
            <TabsTrigger value="categories" data-testid="categories-tab">Catégories</TabsTrigger>
            <TabsTrigger value="comments" data-testid="comments-tab">Commentaires</TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gestion des Articles</h2>
              <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    data-testid="create-article-button"
                    className="bg-[#007FFF] hover:bg-[#0066CC]" 
                    onClick={() => {
                      setEditingArticle(null);
                      setArticleForm({ title: "", content: "", author: "", category_id: "", image_url: "", published: false });
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouvel Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingArticle ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Titre *</Label>
                      <Input
                        data-testid="article-title-input"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        placeholder="Titre de l'article"
                      />
                    </div>
                    <div>
                      <Label>Auteur *</Label>
                      <Input
                        data-testid="article-author-input"
                        value={articleForm.author}
                        onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                        placeholder="Nom de l'auteur"
                      />
                    </div>
                    <div>
                      <Label>Catégorie *</Label>
                      <Select value={articleForm.category_id} onValueChange={(value) => setArticleForm({ ...articleForm, category_id: value })}>
                        <SelectTrigger data-testid="article-category-select">
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Image</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          data-testid="article-image-input"
                        />
                        {uploadingImage && <span className="text-sm">Téléchargement...</span>}
                      </div>
                      {articleForm.image_url && (
                        <img src={`${BACKEND_URL}${articleForm.image_url}`} alt="Preview" className="mt-2 h-32 object-cover rounded" />
                      )}
                    </div>
                    <div>
                      <Label>Contenu *</Label>
                      <Suspense fallback={<div className="h-64 bg-gray-100 rounded flex items-center justify-center">Chargement de l'éditeur...</div>}>
                        <ReactQuill
                          theme="snow"
                          value={articleForm.content}
                          onChange={(value) => setArticleForm({ ...articleForm, content: value })}
                          modules={quillModules}
                          className="bg-white"
                        />
                      </Suspense>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        data-testid="article-published-switch"
                        checked={articleForm.published}
                        onCheckedChange={(checked) => setArticleForm({ ...articleForm, published: checked })}
                      />
                      <Label>Publier immédiatement</Label>
                    </div>
                    <Button 
                      onClick={handleCreateArticle} 
                      className="w-full bg-[#007FFF] hover:bg-[#0066CC]"
                      data-testid="save-article-button"
                    >
                      {editingArticle ? "Mettre à jour" : "Créer"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-white p-6 rounded-xl shadow-md" data-testid={`article-item-${article.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{article.title}</h3>
                        {article.published ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Publié</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Brouillon</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">Par {article.author} • {article.category_name}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(article.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/article/${article.id}`}>
                        <Button variant="outline" size="sm" data-testid={`view-article-${article.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditArticle(article)}
                        data-testid={`edit-article-${article.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteArticle(article.id)}
                        data-testid={`delete-article-${article.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#007FFF] hover:bg-[#0066CC]" data-testid="create-category-button">
                    <Plus className="w-5 h-5 mr-2" />
                    Nouvelle Catégorie
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle catégorie</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        data-testid="category-name-input"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="Nom de la catégorie"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        data-testid="category-description-input"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="Description"
                      />
                    </div>
                    <div>
                      <Label>Couleur</Label>
                      <Input
                        type="color"
                        data-testid="category-color-input"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateCategory} 
                      className="w-full bg-[#007FFF] hover:bg-[#0066CC]"
                      data-testid="save-category-button"
                    >
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.id} className="bg-white p-6 rounded-xl shadow-md" data-testid={`category-item-${category.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-white font-bold">{category.name[0]}</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteCategory(category.id)}
                      data-testid={`delete-category-${category.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <h2 className="text-2xl font-bold mb-6">Modération des Commentaires</h2>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-6 rounded-xl shadow-md" data-testid={`comment-item-${comment.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold">{comment.author}</h4>
                        {comment.approved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approuvé</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">En attente</span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      <p className="text-gray-500 text-sm">
                        Article: {comment.article_title} • {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!comment.approved && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleApproveComment(comment.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          data-testid={`approve-comment-${comment.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteComment(comment.id)}
                        data-testid={`delete-comment-${comment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}