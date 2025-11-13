import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar, User, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ author: "", content: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
    fetchComments();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`${API}/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement de l'article:", error);
      toast.error("Erreur lors du chargement de l'article");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/comments/${id}?approved_only=true`);
      setComments(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.author || !newComment.content) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await axios.post(`${API}/comments`, {
        article_id: id,
        author: newComment.author,
        content: newComment.content
      });
      toast.success("Commentaire envoyé! Il sera publié après modération.");
      setNewComment({ author: "", content: "" });
    } catch (error) {
      console.error("Erreur lors de l'envoi du commentaire:", error);
      toast.error("Erreur lors de l'envoi du commentaire");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-[#007FFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article non trouvé</h2>
          <Link to="/">
            <Button className="bg-[#007FFF] hover:bg-[#0066CC]">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#007FFF] via-[#0066CC] to-[#004C99] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" data-testid="back-to-home">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#CE1126] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">RDC</span>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>E-Page Congo</h1>
              <p className="text-blue-100 text-sm mt-1">Actualités Politiques de la RDC</p>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {article.image_url && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={`${BACKEND_URL}${article.image_url}`}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8 lg:p-12">
            <div className="mb-6">
              <span className="px-4 py-2 bg-[#007FFF] text-white rounded-full text-sm font-semibold">
                {article.category_name}
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="article-title">
              {article.title}
            </h1>

            <div className="flex items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="font-semibold">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(article.created_at)}</span>
              </div>
            </div>

            <div 
              className="article-content text-lg text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }}
              data-testid="article-content"
            />
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Commentaires ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8 p-6 bg-gray-50 rounded-xl" data-testid="comment-form">
            <h3 className="text-lg font-semibold mb-4">Laisser un commentaire</h3>
            <div className="space-y-4">
              <Input
                data-testid="comment-author-input"
                placeholder="Votre nom"
                value={newComment.author}
                onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
                className="border-2 border-gray-200 focus:border-[#007FFF]"
              />
              <Textarea
                data-testid="comment-content-textarea"
                placeholder="Votre commentaire"
                value={newComment.content}
                onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                rows={4}
                className="border-2 border-gray-200 focus:border-[#007FFF]"
              />
              <Button 
                type="submit"
                data-testid="submit-comment-button"
                className="bg-[#007FFF] hover:bg-[#0066CC] text-white px-8 rounded-full"
              >
                Envoyer
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun commentaire pour le moment. Soyez le premier à commenter!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6 last:border-b-0" data-testid={`comment-${comment.id}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#007FFF] to-[#0066CC] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{comment.author[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{comment.author}</p>
                      <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 ml-13">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </article>

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