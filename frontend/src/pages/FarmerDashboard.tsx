import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sprout, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Droplets,
  Sun,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { toast } from 'sonner';

interface Crop {
  id: string;
  name: string;
  variety: string;
  plantedDate: Date;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date;
  quantity: number;
  unit: string;
  status: 'growing' | 'ready' | 'harvested' | 'sold';
  price: number;
  image: string;
  notes?: string;
}

interface Harvest {
  id: string;
  cropId: string;
  cropName: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  price: number;
  soldQuantity: number;
  remainingQuantity: number;
}

interface MarketInsight {
  cropName: string;
  currentPrice: number;
  priceChange: number;
  demand: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: Array<{
    date: string;
    temperature: number;
    condition: string;
  }>;
}

interface FarmAnalytics {
  totalCrops: number;
  activeCrops: number;
  totalHarvest: number;
  totalRevenue: number;
  averageYield: number;
  topCrops: Array<{
    name: string;
    yield: number;
    revenue: number;
  }>;
}

export default function FarmerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [analytics, setAnalytics] = useState<FarmAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'farmer') {
      navigate('/login');
      return;
    }

    // Simulate loading
    setTimeout(() => {
      setCrops([
        {
          id: '1',
          name: 'Tomatoes',
          variety: 'Roma',
          plantedDate: new Date('2024-01-15'),
          expectedHarvestDate: new Date('2024-03-15'),
          quantity: 500,
          unit: 'kg',
          status: 'growing',
          price: 2500,
          image: '/placeholder.svg',
          notes: 'Growing well, no pests detected'
        },
        {
          id: '2',
          name: 'Plantains',
          variety: 'Sweet',
          plantedDate: new Date('2023-11-01'),
          expectedHarvestDate: new Date('2024-02-01'),
          actualHarvestDate: new Date('2024-02-05'),
          quantity: 200,
          unit: 'bunches',
          status: 'harvested',
          price: 1500,
          image: '/placeholder.svg'
        }
      ]);

      setHarvests([
        {
          id: '1',
          cropId: '2',
          cropName: 'Plantains',
          quantity: 200,
          unit: 'bunches',
          harvestDate: new Date('2024-02-05'),
          quality: 'excellent',
          price: 1500,
          soldQuantity: 150,
          remainingQuantity: 50
        }
      ]);

      setMarketInsights([
        {
          cropName: 'Tomatoes',
          currentPrice: 2500,
          priceChange: 15,
          demand: 'high',
          recommendation: 'Good time to harvest and sell'
        },
        {
          cropName: 'Plantains',
          currentPrice: 1500,
          priceChange: -5,
          demand: 'medium',
          recommendation: 'Consider holding for better prices'
        }
      ]);

      setWeatherData({
        temperature: 28,
        humidity: 75,
        rainfall: 0,
        forecast: [
          { date: 'Today', temperature: 28, condition: 'Sunny' },
          { date: 'Tomorrow', temperature: 26, condition: 'Cloudy' },
          { date: 'Day 3', temperature: 27, condition: 'Partly Cloudy' }
        ]
      });

      setAnalytics({
        totalCrops: 5,
        activeCrops: 3,
        totalHarvest: 750,
        totalRevenue: 375000,
        averageYield: 150,
        topCrops: [
          { name: 'Tomatoes', yield: 500, revenue: 1250000 },
          { name: 'Plantains', yield: 200, revenue: 300000 },
          { name: 'Corn', yield: 50, revenue: 75000 }
        ]
      });

      setIsLoading(false);
    }, 1000);
  }, [isAuthenticated, user, navigate]);

  const handleCropStatusUpdate = (cropId: string, newStatus: Crop['status']) => {
    setCrops(prev => prev.map(crop => 
      crop.id === cropId ? { ...crop, status: newStatus } : crop
    ));
    toast.success(`Crop status updated to ${newStatus}`);
  };

  const getStatusBadgeVariant = (status: Crop['status']) => {
    switch (status) {
      case 'growing': return 'secondary';
      case 'ready': return 'default';
      case 'harvested': return 'default';
      case 'sold': return 'default';
      default: return 'secondary';
    }
  };

  const getQualityBadgeVariant = (quality: Harvest['quality']) => {
    switch (quality) {
      case 'excellent': return 'default';
      case 'good': return 'default';
      case 'fair': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDemandBadgeVariant = (demand: MarketInsight['demand']) => {
    switch (demand) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!isAuthenticated || user?.user_type !== 'farmer') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your farm dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Farm Hub</h1>
              <p className="text-gray-300">Manage your crops, harvests, and farm analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-gray-400 text-sm">{user?.business_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{analytics?.totalRevenue.toLocaleString()} CFA</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Crops</p>
                  <p className="text-2xl font-bold text-white">{analytics?.activeCrops}</p>
                </div>
                <Sprout className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Harvest</p>
                  <p className="text-2xl font-bold text-white">{analytics?.totalHarvest} kg</p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Yield</p>
                  <p className="text-2xl font-bold text-white">{analytics?.averageYield} kg</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Widget */}
        {weatherData && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Weather & Farm Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Thermometer className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Temperature</p>
                  <p className="text-2xl font-bold text-white">{weatherData.temperature}°C</p>
                </div>
                <div className="text-center">
                  <Droplets className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Humidity</p>
                  <p className="text-2xl font-bold text-white">{weatherData.humidity}%</p>
                </div>
                <div className="text-center">
                  <CloudRain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Rainfall</p>
                  <p className="text-2xl font-bold text-white">{weatherData.rainfall}mm</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Forecast</p>
                  <p className="text-lg font-bold text-white">{weatherData.forecast[0].condition}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="crops" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Crops
            </TabsTrigger>
            <TabsTrigger value="harvests" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Harvests
            </TabsTrigger>
            <TabsTrigger value="market" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Market
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Crops */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sprout className="w-5 h-5" />
                    Active Crops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {crops.filter(crop => crop.status === 'growing').map((crop) => (
                      <div key={crop.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{crop.name}</p>
                          <p className="text-gray-400 text-sm">{crop.variety}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{crop.quantity} {crop.unit}</p>
                          <Badge variant={getStatusBadgeVariant(crop.status)} className="text-xs">
                            {crop.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketInsights.map((insight) => (
                      <div key={insight.cropName} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{insight.cropName}</p>
                          <p className="text-gray-400 text-sm">{insight.currentPrice.toLocaleString()} CFA</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getDemandBadgeVariant(insight.demand)} className="text-xs mb-1">
                            {insight.demand} demand
                          </Badge>
                          <p className={`text-xs ${insight.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {insight.priceChange >= 0 ? '+' : ''}{insight.priceChange}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Crops Tab */}
          <TabsContent value="crops" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Crop Management</CardTitle>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crops.map((crop) => (
                    <div key={crop.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <img src={crop.image} alt={crop.name} className="w-16 h-16 rounded-lg object-cover" />
                        <Badge variant={getStatusBadgeVariant(crop.status)}>
                          {crop.status}
                        </Badge>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{crop.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{crop.variety}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Quantity:</span>
                          <span className="text-white">{crop.quantity} {crop.unit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white font-medium">{crop.price.toLocaleString()} CFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Planted:</span>
                          <span className="text-white">{crop.plantedDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Expected Harvest:</span>
                          <span className="text-white">{crop.expectedHarvestDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      {crop.notes && (
                        <div className="mt-3 p-2 bg-gray-700/30 rounded text-sm">
                          <p className="text-gray-300">{crop.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white flex-1"
                          onClick={() => handleCropStatusUpdate(crop.id, 'ready')}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Harvests Tab */}
          <TabsContent value="harvests" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Harvest Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {harvests.map((harvest) => (
                    <div key={harvest.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold">{harvest.cropName}</h3>
                          <p className="text-gray-400 text-sm">Harvested on {harvest.harvestDate.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{harvest.quantity} {harvest.unit}</p>
                          <Badge variant={getQualityBadgeVariant(harvest.quality)} className="text-xs">
                            {harvest.quality} quality
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Total Quantity:</p>
                          <p className="text-white font-medium">{harvest.quantity} {harvest.unit}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Sold:</p>
                          <p className="text-white font-medium">{harvest.soldQuantity} {harvest.unit}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Remaining:</p>
                          <p className="text-white font-medium">{harvest.remainingQuantity} {harvest.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {harvest.harvestDate.toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                          >
                            Sell More
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Tab */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Market Prices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketInsights.map((insight) => (
                      <div key={insight.cropName} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">{insight.cropName}</h3>
                          <Badge variant={getDemandBadgeVariant(insight.demand)}>
                            {insight.demand} demand
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Current Price:</span>
                            <span className="text-white font-medium">{insight.currentPrice.toLocaleString()} CFA</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Price Change:</span>
                            <span className={`font-medium ${insight.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {insight.priceChange >= 0 ? '+' : ''}{insight.priceChange}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-gray-700/30 rounded">
                          <p className="text-gray-300 text-sm">{insight.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Performing Crops
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.topCrops.map((crop, index) => (
                      <div key={crop.name} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{crop.name}</p>
                            <p className="text-gray-400 text-sm">{crop.yield} kg yield</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{crop.revenue.toLocaleString()} CFA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 