import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Eye, 
  Truck, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  FileText,
  Camera,
  Star
} from 'lucide-react';

const Safety = () => {
  const safetyFeatures = [
    {
      icon: Users,
      title: "Verified Users",
      description: "All merchants and delivery agents undergo thorough background checks and verification processes",
      features: [
        "Identity verification",
        "Background screening",
        "Business license validation",
        "Regular re-verification"
      ],
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Truck,
      title: "Safe Delivery",
      description: "Real-time tracking and secure delivery protocols ensure your orders arrive safely",
      features: [
        "Live GPS tracking",
        "Delivery agent photos",
        "Contact information sharing",
        "Delivery confirmation"
      ],
      color: "bg-green-100 text-green-600"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Multiple secure payment options with encryption and fraud protection",
      features: [
        "Mobile money integration",
        "Encrypted transactions",
        "Fraud detection",
        "Payment verification"
      ],
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: MapPin,
      title: "Location Privacy",
      description: "Your location data is protected and only shared when necessary for delivery",
      features: [
        "Encrypted location data",
        "Temporary access only",
        "Data deletion options",
        "Privacy controls"
      ],
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const securityMeasures = [
    {
      title: "Data Encryption",
      description: "All sensitive data is encrypted using industry-standard protocols",
      icon: Lock,
      details: [
        "End-to-end encryption for messages",
        "SSL/TLS for website security",
        "Encrypted payment processing",
        "Secure API communications"
      ]
    },
    {
      title: "Privacy Protection",
      description: "Your personal information is protected and never sold to third parties",
      icon: Eye,
      details: [
        "GDPR compliance",
        "Data minimization practices",
        "User consent controls",
        "Regular privacy audits"
      ]
    },
    {
      title: "Fraud Prevention",
      description: "Advanced systems detect and prevent fraudulent activities",
      icon: AlertTriangle,
      details: [
        "AI-powered fraud detection",
        "Transaction monitoring",
        "Suspicious activity alerts",
        "24/7 security monitoring"
      ]
    },
    {
      title: "Secure Infrastructure",
      description: "Our platform is built on secure, reliable cloud infrastructure",
      icon: Shield,
      details: [
        "AWS/Azure security standards",
        "Regular security updates",
        "DDoS protection",
        "Backup and recovery systems"
      ]
    }
  ];

  const safetyTips = [
    {
      category: "For Customers",
      tips: [
        "Always verify delivery agent identity before accepting orders",
        "Use the app's built-in messaging for communication",
        "Report any suspicious activity immediately",
        "Keep your contact information updated",
        "Use secure payment methods"
      ]
    },
    {
      category: "For Merchants",
      tips: [
        "Verify customer orders before processing",
        "Maintain accurate product descriptions",
        "Use secure payment processing",
        "Report any fraudulent orders",
        "Keep business information current"
      ]
    },
    {
      category: "For Delivery Agents",
      tips: [
        "Always wear your ChronoConnect identification",
        "Follow delivery protocols strictly",
        "Report any safety concerns immediately",
        "Maintain professional conduct",
        "Use the app for all communications"
      ]
    }
  ];

  const emergencyContacts = [
    {
      title: "ChronoConnect Security",
      phone: "+237 6XX XXX XXX",
      description: "24/7 security hotline for immediate assistance",
      badge: "24/7"
    },
    {
      title: "Customer Support",
      phone: "+237 6XX XXX XXX",
      description: "General support and non-emergency issues",
      badge: "8AM-6PM"
    },
    {
      title: "Local Police",
      phone: "117",
      description: "For serious security incidents",
      badge: "Emergency"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Safety & Security</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your safety and security are our top priorities. Learn about the measures we take to protect you and your data.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link to="/contact">Report an Issue</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/help">Safety FAQ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/terms">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Safety Features</h2>
            <p className="text-muted-foreground">Comprehensive protection for all users of our platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {safetyFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Security Measures</h2>
            <p className="text-muted-foreground">Advanced security protocols protect your data and transactions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityMeasures.map((measure, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <measure.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{measure.title}</h3>
                    <p className="text-sm text-muted-foreground">{measure.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {measure.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Safety Tips</h2>
            <p className="text-muted-foreground">Best practices to ensure a safe experience on ChronoConnect</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {safetyTips.map((category, index) => (
              <Card key={index} className="p-6">
                <div className="mb-4">
                  <Badge variant="secondary" className="mb-2">
                    {category.category}
                  </Badge>
                </div>
                <ul className="space-y-3">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Emergency Contacts</h2>
            <p className="text-muted-foreground">Important numbers for safety and security issues</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{contact.title}</h3>
                <p className="text-lg font-mono text-primary mb-2">{contact.phone}</p>
                <p className="text-sm text-muted-foreground mb-3">{contact.description}</p>
                <Badge variant="destructive" className="text-xs">
                  {contact.badge}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Trust ChronoConnect?</h2>
            <p className="text-muted-foreground">We're committed to maintaining the highest standards of safety and security</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Verified Community</h3>
              <p className="text-sm text-muted-foreground">All users are verified and background-checked</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Real-time Tracking</h3>
              <p className="text-sm text-muted-foreground">Track your orders and delivery agents in real-time</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Rating System</h3>
              <p className="text-sm text-muted-foreground">Rate and review for community safety</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparent Policies</h3>
              <p className="text-sm text-muted-foreground">Clear terms and privacy policies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Have a Safety Concern?</h2>
          <p className="text-background/80 mb-8">
            If you encounter any safety or security issues, don't hesitate to reach out to us immediately.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" asChild>
              <Link to="/contact">Report an Issue</Link>
            </Button>
            <Button variant="outline" className="border-background/20 text-background hover:bg-background/10" asChild>
              <Link to="/help">Safety FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Safety; 