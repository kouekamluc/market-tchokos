import { useAuth } from '@/contexts/AuthContext'
import { useCategories, useProducts } from '@/hooks/useApi'
import { LoginForm } from '@/components/LoginForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function TestIntegration() {
  const { user, isAuthenticated, logout } = useAuth()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: products, isLoading: productsLoading } = useProducts({ page_size: 5 })

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully!')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Frontend-Backend Integration Test</h1>
      
      <div className="grid gap-8">
        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>
              Test the authentication flow with the backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <Badge variant="secondary">Authenticated</Badge>
                </div>
                <div className="space-y-2">
                  <p><strong>User:</strong> {user?.first_name} {user?.last_name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                </div>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            ) : (
              <LoginForm />
            )}
          </CardContent>
        </Card>

        {/* API Data Section */}
        {isAuthenticated && (
          <>
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories from API</CardTitle>
                <CardDescription>
                  Fetching categories from the backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <p>Loading categories...</p>
                ) : categories ? (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Badge variant="outline">{category.id}</Badge>
                        <span>{category.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No categories found</p>
                )}
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Products from API</CardTitle>
                <CardDescription>
                  Fetching products from the backend
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <p>Loading products...</p>
                ) : products ? (
                  <div className="space-y-4">
                    <p><strong>Total:</strong> {products.count} products</p>
                    <div className="space-y-2">
                      {products.results.map((product) => (
                        <div key={product.id} className="border p-3 rounded">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-sm"><strong>Price:</strong> ${product.price}</p>
                          <p className="text-sm"><strong>Category:</strong> {product.category.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No products found</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
            <CardDescription>
              How to test the frontend-backend integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">1. Backend Setup</h4>
                <p className="text-sm text-gray-600">
                  Ensure the Django backend is running on port 8000 with the database migrated.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">2. Frontend Setup</h4>
                <p className="text-sm text-gray-600">
                  Copy env.example to .env and set VITE_API_BASE_URL=http://localhost:8000/api
                </p>
              </div>
              <div>
                <h4 className="font-semibold">3. Test Authentication</h4>
                <p className="text-sm text-gray-600">
                  Try logging in with valid credentials to test the JWT authentication flow.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">4. Test API Calls</h4>
                <p className="text-sm text-gray-600">
                  Once authenticated, the categories and products should load from the backend API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 