import requests
import sys
import json
from datetime import datetime

class RDCBlogAPITester:
    def __init__(self, base_url="https://rdc-news-blog.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_category_id = None
        self.created_article_id = None
        self.created_comment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_categories(self):
        """Test category CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CATEGORIES")
        print("="*50)
        
        # Test get categories (empty initially)
        success, response = self.run_test(
            "Get Categories (Empty)",
            "GET",
            "categories",
            200
        )
        
        # Test create category
        category_data = {
            "name": "Politique",
            "description": "Articles sur la politique congolaise",
            "color": "#007FFF"
        }
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data=category_data
        )
        if success and 'id' in response:
            self.created_category_id = response['id']
            print(f"   Created category ID: {self.created_category_id}")
        
        # Test get categories (should have one now)
        success, response = self.run_test(
            "Get Categories (With Data)",
            "GET",
            "categories",
            200
        )
        
        return self.created_category_id is not None

    def test_articles(self):
        """Test article CRUD operations"""
        print("\n" + "="*50)
        print("TESTING ARTICLES")
        print("="*50)
        
        if not self.created_category_id:
            print("❌ Cannot test articles without category")
            return False
        
        # Test get articles (empty initially)
        success, response = self.run_test(
            "Get Articles (Empty)",
            "GET",
            "articles",
            200
        )
        
        # Test create article
        article_data = {
            "title": "Test Article RDC",
            "content": "<p>Ceci est un article de test sur la politique de la RDC.</p>",
            "author": "Test Author",
            "category_id": self.created_category_id,
            "published": True
        }
        success, response = self.run_test(
            "Create Article",
            "POST",
            "articles",
            200,
            data=article_data
        )
        if success and 'id' in response:
            self.created_article_id = response['id']
            print(f"   Created article ID: {self.created_article_id}")
        
        # Test get articles (should have one now)
        success, response = self.run_test(
            "Get Articles (With Data)",
            "GET",
            "articles",
            200
        )
        
        # Test get published articles only
        success, response = self.run_test(
            "Get Published Articles Only",
            "GET",
            "articles?published_only=true",
            200
        )
        
        # Test get single article
        if self.created_article_id:
            success, response = self.run_test(
                "Get Single Article",
                "GET",
                f"articles/{self.created_article_id}",
                200
            )
            
            # Test update article
            update_data = {
                "title": "Updated Test Article RDC",
                "published": False
            }
            success, response = self.run_test(
                "Update Article",
                "PUT",
                f"articles/{self.created_article_id}",
                200,
                data=update_data
            )
        
        # Test search articles
        success, response = self.run_test(
            "Search Articles",
            "GET",
            "articles?search=RDC",
            200
        )
        
        # Test filter by category
        success, response = self.run_test(
            "Filter Articles by Category",
            "GET",
            f"articles?category_id={self.created_category_id}",
            200
        )
        
        return self.created_article_id is not None

    def test_comments(self):
        """Test comment operations"""
        print("\n" + "="*50)
        print("TESTING COMMENTS")
        print("="*50)
        
        if not self.created_article_id:
            print("❌ Cannot test comments without article")
            return False
        
        # Test get comments (empty initially)
        success, response = self.run_test(
            "Get Comments (Empty)",
            "GET",
            f"comments/{self.created_article_id}",
            200
        )
        
        # Test create comment
        comment_data = {
            "article_id": self.created_article_id,
            "author": "Test Commenter",
            "content": "Ceci est un commentaire de test."
        }
        success, response = self.run_test(
            "Create Comment",
            "POST",
            "comments",
            200,
            data=comment_data
        )
        if success and 'id' in response:
            self.created_comment_id = response['id']
            print(f"   Created comment ID: {self.created_comment_id}")
        
        # Test get comments (should have one now)
        success, response = self.run_test(
            "Get Comments (With Data)",
            "GET",
            f"comments/{self.created_article_id}",
            200
        )
        
        # Test approve comment
        if self.created_comment_id:
            success, response = self.run_test(
                "Approve Comment",
                "PUT",
                f"comments/{self.created_comment_id}/approve",
                200
            )
            
            # Test get approved comments only
            success, response = self.run_test(
                "Get Approved Comments Only",
                "GET",
                f"comments/{self.created_article_id}?approved_only=true",
                200
            )
        
        return self.created_comment_id is not None

    def test_image_upload(self):
        """Test image upload functionality"""
        print("\n" + "="*50)
        print("TESTING IMAGE UPLOAD")
        print("="*50)
        
        # Create a simple test image file
        import io
        from PIL import Image
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
        
        success, response = self.run_test(
            "Upload Image",
            "POST",
            "upload",
            200,
            files=files
        )
        
        if success and 'url' in response:
            print(f"   Uploaded image URL: {response['url']}")
            
            # Test accessing the uploaded image
            image_url = f"{self.base_url}{response['url']}"
            try:
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    print("✅ Image accessible via URL")
                    return True
                else:
                    print(f"❌ Image not accessible - Status: {img_response.status_code}")
            except Exception as e:
                print(f"❌ Error accessing image: {e}")
        
        return False

    def cleanup(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANUP")
        print("="*50)
        
        # Delete comment
        if self.created_comment_id:
            self.run_test(
                "Delete Comment",
                "DELETE",
                f"comments/{self.created_comment_id}",
                200
            )
        
        # Delete article
        if self.created_article_id:
            self.run_test(
                "Delete Article",
                "DELETE",
                f"articles/{self.created_article_id}",
                200
            )
        
        # Delete category
        if self.created_category_id:
            self.run_test(
                "Delete Category",
                "DELETE",
                f"categories/{self.created_category_id}",
                200
            )

def main():
    print("🚀 Starting RDC Blog API Tests")
    print("="*60)
    
    tester = RDCBlogAPITester()
    
    try:
        # Run all tests
        categories_ok = tester.test_categories()
        articles_ok = tester.test_articles()
        comments_ok = tester.test_comments()
        upload_ok = tester.test_image_upload()
        
        # Cleanup
        tester.cleanup()
        
        # Print results
        print("\n" + "="*60)
        print("📊 FINAL RESULTS")
        print("="*60)
        print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
        print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        if categories_ok and articles_ok and comments_ok:
            print("✅ All core functionality working")
            return 0
        else:
            print("❌ Some core functionality failed")
            return 1
            
    except Exception as e:
        print(f"❌ Test suite failed with error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())