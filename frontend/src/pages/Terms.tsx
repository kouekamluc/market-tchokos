import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Shield, 
  Users, 
  CreditCard, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Mail
} from 'lucide-react';

const Terms = () => {
  const [activeTab, setActiveTab] = useState('terms');

  const lastUpdated = "January 15, 2025";

  const termsSections = [
    {
      title: "Acceptance of Terms",
      content: `By accessing and using ChronoConnect, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
    },
    {
      title: "Description of Service",
      content: `ChronoConnect is a digital marketplace platform that connects customers with merchants and delivery agents. Our services include product listings, order processing, payment processing, and delivery coordination.`
    },
    {
      title: "User Accounts",
      content: `You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.`
    },
    {
      title: "Prohibited Activities",
      content: `Users may not: engage in fraudulent activities, violate any laws, harass other users, upload malicious content, or attempt to gain unauthorized access to our systems.`
    },
    {
      title: "Payment Terms",
      content: `All payments are processed securely through our payment partners. Prices are subject to change without notice. Delivery fees apply based on distance and service type.`
    },
    {
      title: "Delivery and Returns",
      content: `Delivery times are estimates only. Returns are subject to merchant policies. Damaged or incorrect items must be reported within 24 hours of delivery.`
    },
    {
      title: "Intellectual Property",
      content: `All content on ChronoConnect, including text, graphics, logos, and software, is the property of ChronoConnect or its licensors and is protected by copyright laws.`
    },
    {
      title: "Limitation of Liability",
      content: `ChronoConnect is not liable for any indirect, incidental, special, or consequential damages arising from your use of our services.`
    },
    {
      title: "Termination",
      content: `We may terminate or suspend your account at any time for violations of these terms. You may terminate your account at any time by contacting customer support.`
    },
    {
      title: "Changes to Terms",
      content: `We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.`
    }
  ];

  const privacySections = [
    {
      title: "Information We Collect",
      content: `We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This includes name, email, phone number, address, and payment information.`
    },
    {
      title: "How We Use Your Information",
      content: `We use your information to: process orders and payments, provide customer support, send notifications, improve our services, and comply with legal obligations.`
    },
    {
      title: "Information Sharing",
      content: `We do not sell your personal information. We may share information with: delivery agents (for order fulfillment), payment processors, and law enforcement when required by law.`
    },
    {
      title: "Location Data",
      content: `We collect location data to provide delivery services. This data is encrypted and only shared with delivery agents during active deliveries. You can control location permissions in your device settings.`
    },
    {
      title: "Data Security",
      content: `We implement appropriate security measures to protect your personal information, including encryption, secure servers, and regular security audits.`
    },
    {
      title: "Data Retention",
      content: `We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data by contacting us.`
    },
    {
      title: "Your Rights",
      content: `You have the right to: access your personal information, correct inaccurate data, request deletion, and opt out of marketing communications.`
    },
    {
      title: "Cookies and Tracking",
      content: `We use cookies and similar technologies to improve your experience, analyze usage, and provide personalized content. You can control cookie settings in your browser.`
    },
    {
      title: "Third-Party Services",
      content: `Our service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.`
    },
    {
      title: "Children's Privacy",
      content: `Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.`
    }
  ];

  const legalDocuments = [
    {
      title: "Terms of Service",
      description: "Complete terms and conditions for using ChronoConnect",
      icon: FileText,
      lastUpdated: "January 15, 2025",
      downloadUrl: "#"
    },
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your information",
      icon: Shield,
      lastUpdated: "January 15, 2025",
      downloadUrl: "#"
    },
    {
      title: "Merchant Agreement",
      description: "Terms for merchants selling on our platform",
      icon: Users,
      lastUpdated: "January 15, 2025",
      downloadUrl: "#"
    },
    {
      title: "Delivery Partner Terms",
      description: "Terms for delivery agents and partners",
      icon: MapPin,
      lastUpdated: "January 15, 2025",
      downloadUrl: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms & Privacy</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Important legal information about using ChronoConnect. Please read these documents carefully.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="terms">Terms of Service</TabsTrigger>
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="terms" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">Terms of Service</h2>
                <p className="text-muted-foreground">
                  These terms govern your use of ChronoConnect and our services
                </p>
              </div>
              
              <div className="space-y-6">
                {termsSections.map((section, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="privacy" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-4">Privacy Policy</h2>
                <p className="text-muted-foreground">
                  How we collect, use, and protect your personal information
                </p>
              </div>
              
              <div className="space-y-6">
                {privacySections.map((section, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Legal Documents */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Legal Documents</h2>
            <p className="text-muted-foreground">Download our complete legal documents</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {legalDocuments.map((document, index) => (
              <Card key={index} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <document.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{document.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{document.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated: {document.lastUpdated}
                      </span>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Key Points</h2>
            <p className="text-muted-foreground">Important highlights from our terms and privacy policy</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">All transactions are encrypted and secure</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Data Protection</h3>
              <p className="text-sm text-muted-foreground">Your personal information is protected</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">User Rights</h3>
              <p className="text-sm text-muted-foreground">You control your data and privacy</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Clear Policies</h3>
              <p className="text-sm text-muted-foreground">Transparent terms and conditions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Legal */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Questions About Our Terms?</h2>
          <p className="text-muted-foreground mb-8">
            If you have any questions about our terms of service or privacy policy, please don't hesitate to contact us.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link to="/contact">Contact Legal Team</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:legal@chronoconnect.com">
                <Mail className="w-4 h-4 mr-2" />
                legal@chronoconnect.com
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            Questions about our terms? <Link to="/contact" className="underline hover:text-white">Contact us</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Terms; 