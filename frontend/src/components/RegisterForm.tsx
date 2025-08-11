import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

export function RegisterForm() {
  const [step, setStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'customer' as 'customer' | 'merchant' | 'farmer' | 'delivery_agent'
  })
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phone_number) {
      toast.error('Phone number is required')
      return
    }

    setIsSendingCode(true)

    try {
      await api.post('/users/send-verification-code/', { 
        phone: formData.phone_number 
      })
      setStep(2)
      toast.success('Verification code sent to your phone!')
    } catch (error: any) {
      console.error('Error sending verification code:', error)
      toast.error(error.response?.data?.error || 'Failed to send verification code')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setIsVerifying(true)

    try {
      // First verify the phone number
      await api.post('/users/verify-phone/', {
        phone: formData.phone_number,
        code: verificationCode
      })

      // Then complete registration
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        role: formData.role
      })
      
      toast.success('Registration successful!')
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const goBackToStep1 = () => {
    setStep(1)
    setVerificationCode('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {step === 1 ? 'Join ChronoConnect' : 'Verify Your Phone'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {step === 1 
                ? 'Create your account and start your journey'
                : 'Enter the verification code sent to your phone'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleSendVerificationCode} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-gray-200">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="John"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-gray-200">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Doe"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-gray-200">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-200">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="customer" className="text-gray-200 hover:bg-gray-700">Customer</SelectItem>
                      <SelectItem value="merchant" className="text-gray-200 hover:bg-gray-700">Merchant</SelectItem>
                      <SelectItem value="farmer" className="text-gray-200 hover:bg-gray-700">Farmer</SelectItem>
                      <SelectItem value="delivery_agent" className="text-gray-200 hover:bg-gray-700">Delivery Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 shadow-lg transform hover:scale-105 transition-all duration-200" 
                  disabled={isSendingCode}
                >
                  {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-gray-200">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    We sent a verification code to {formData.phone_number}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={goBackToStep1}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 shadow-lg transform hover:scale-105 transition-all duration-200" 
                    disabled={isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Complete Registration'}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 