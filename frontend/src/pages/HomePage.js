import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Calendar, User, ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };

  const fetchArticles = async (categoryId = null, searchText = "") => {
    setLoading(true);
    try {
      let url = `${API}/articles?published_only=true`;
      if (categoryId) url += `&category_id=${categoryId}`;
      if (searchText) url += `&search=${searchText}`;
      
      const response = await axios.get(url);
      setArticles(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchArticles(selectedCategory, search);
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchArticles(categoryId, search);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>E-Page Congo</h1>
                <p className="text-blue-100 text-sm mt-1">Actualités Politiques de la RDC</p>
              </div>
            </div>
            <Link to="/admin" data-testid="admin-link">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                Administration
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search and Filter Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Rechercher des articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 py-6 rounded-full border-2 border-gray-200 focus:border-[#007FFF]"
                />
              </div>
              <Button 
                data-testid="search-button"
                onClick={handleSearch}
                className="bg-[#007FFF] hover:bg-[#0066CC] text-white px-8 rounded-full"
              >
                Rechercher
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Button
              data-testid="category-all-button"
              onClick={() => handleCategoryFilter(null)}
              variant={selectedCategory === null ? "default" : "outline"}
              className={`rounded-full px-6 whitespace-nowrap ${
                selectedCategory === null 
                  ? 'bg-[#007FFF] hover:bg-[#0066CC] text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Toutes
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                data-testid={`category-${category.id}-button`}
                onClick={() => handleCategoryFilter(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`rounded-full px-6 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'text-white'
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                  borderColor: category.color,
                  color: selectedCategory === category.id ? 'white' : category.color
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#007FFF] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Chargement des articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                data-testid={`article-card-${article.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden h-full flex flex-col">
                  {article.image_url && (
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={`${BACKEND_URL}${article.image_url}`}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110"
                        style={{ transition: 'transform 0.5s' }}
                      />
                      <div className="absolute top-4 left-4">
                        <span
                          className="px-4 py-1 rounded-full text-white text-sm font-semibold shadow-lg"
                          style={{ backgroundColor: categories.find(c => c.id === article.category_id)?.color || '#007FFF' }}
                        >
                          {article.category_name}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#007FFF] line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {article.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.created_at)}</span>
                      </div>
                    </div>
                    <div
                      className="text-gray-600 line-clamp-3 mb-4 flex-1"
                      dangerouslySetInnerHTML={{ __html: article.content.substring(0, 150) + '...' }}
                    />
                    <div className="flex items-center text-[#007FFF] font-semibold group-hover:gap-2" style={{ transition: 'gap 0.2s' }}>
                      <span>Lire la suite</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#CE1126] rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">RDC</span>
            </div>
            <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>E-Page Congo</h3>
          </div>
          <p className="text-gray-400">Votre source d'information politique sur la RDC</p>
          <p className="text-gray-500 text-sm mt-4">© 2025 E-Page Congo. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}