import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Globe
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success
    setSubmitStatus('success');
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: ''
      });
      setSubmitStatus('idle');
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone Support",
      details: [
        { label: "Customer Support", value: "+237 6XX XXX XXX" },
        { label: "Business Inquiries", value: "+237 6XX XXX XXX" },
        { label: "Emergency", value: "+237 6XX XXX XXX" }
      ],
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      details: [
        { label: "General Inquiries", value: "hello@chronoconnect.com" },
        { label: "Support", value: "support@chronoconnect.com" },
        { label: "Business", value: "business@chronoconnect.com" }
      ],
      color: "bg-green-100 text-green-600"
    },
    {
      icon: MapPin,
      title: "Office Location",
      details: [
        { label: "Address", value: "123 Commerce Street, Douala, Cameroon" },
        { label: "Hours", value: "Mon-Fri: 9AM-6PM" },
        { label: "Weekend", value: "Sat: 9AM-2PM" }
      ],
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const departments = [
    {
      name: "Customer Support",
      description: "Help with orders, deliveries, and account issues",
      contact: "support@chronoconnect.com",
      response: "Within 2 hours"
    },
    {
      name: "Business Development",
      description: "Merchant partnerships and business opportunities",
      contact: "business@chronoconnect.com",
      response: "Within 24 hours"
    },
    {
      name: "Technical Support",
      description: "App issues, bugs, and technical problems",
      contact: "tech@chronoconnect.com",
      response: "Within 4 hours"
    },
    {
      name: "Partnerships",
      description: "Strategic partnerships and collaborations",
      contact: "partnerships@chronoconnect.com",
      response: "Within 48 hours"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get in touch with our team. We're here to help with any questions, concerns, or feedback you might have.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">Choose your preferred way to reach us</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((info, index) => (
              <Card key={index} className="p-6 text-center">
                <div className={`w-12 h-12 ${info.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <info.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-4">{info.title}</h3>
                <div className="space-y-3">
                  {info.details.map((detail, detailIndex) => (
                    <div key={detailIndex}>
                      <p className="text-sm font-medium text-muted-foreground">{detail.label}</p>
                      <p className="text-foreground">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Send us a Message</h2>
            <p className="text-muted-foreground">Fill out the form below and we'll get back to you as soon as possible</p>
          </div>
          
          <Card className="p-8">
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent Successfully!</h3>
                <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="support">Customer Support</SelectItem>
                        <SelectItem value="business">Business Partnership</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    placeholder="Brief description of your inquiry"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    placeholder="Please provide details about your inquiry..."
                    rows={6}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                  {submitStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Failed to send message. Please try again.</span>
                    </div>
                  )}
                </div>
              </form>
            )}
          </Card>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Departments</h2>
            <p className="text-muted-foreground">Find the right team to help with your specific needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{dept.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {dept.response}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${dept.contact}`} className="text-primary hover:underline">
                    {dept.contact}
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Office Information */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Visit Our Office</h2>
            <p className="text-muted-foreground">Come see us in person at our headquarters</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold text-foreground">ChronoConnect Headquarters</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">123 Commerce Street</p>
                      <p className="text-muted-foreground">Douala, Littoral Region, Cameroon</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Business Hours</p>
                      <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="text-muted-foreground">Saturday: 9:00 AM - 2:00 PM</p>
                      <p className="text-muted-foreground">Sunday: Closed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-muted-foreground">+237 6XX XXX XXX</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Interactive Map Coming Soon</p>
                <p className="text-sm">We're working on adding an interactive map to show our location</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            Need immediate help? <Link to="/help" className="underline hover:text-white">Visit our Help Center</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact; 