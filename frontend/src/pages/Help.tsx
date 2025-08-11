import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Shield, 
  Truck, 
  CreditCard, 
  Smartphone,
  Users,
  FileText
} from 'lucide-react';

const Help = () => {
  const faqs = [
    {
      category: "Shopping",
      items: [
        {
          question: "How do I place an order?",
          answer: "Browse products in Marketplace or AgriConnect, add items to cart, and proceed to checkout. You'll need to drop a pin on the map for delivery location and provide contact details."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We accept Mobile Money (MTN, Orange, Moov), Cash on Delivery, and bank transfers. All payments are secure and encrypted."
        },
        {
          question: "How long does delivery take?",
          answer: "Standard delivery takes 2-4 hours within city limits. Express delivery (1-2 hours) is available for an additional fee. Rural areas may take 24-48 hours."
        },
        {
          question: "Can I track my order?",
          answer: "Yes! Once your order is confirmed, you'll receive a tracking link. You can see your delivery agent's location in real-time and contact them directly."
        }
      ]
    },
    {
      category: "Delivery",
      items: [
        {
          question: "How does the location pinning work?",
          answer: "During checkout, you'll see a map where you can drop a pin at your exact delivery location. Add a landmark description (e.g., 'In front of the blue house') to help the delivery agent find you."
        },
        {
          question: "What if I'm not home for delivery?",
          answer: "You can specify alternative delivery instructions or reschedule. Our delivery agents will call you before arrival. You can also authorize someone else to receive your order."
        },
        {
          question: "Is delivery free?",
          answer: "Delivery is free for orders above 10,000 FCFA. Orders below this amount have a delivery fee of 500-1000 FCFA depending on distance."
        }
      ]
    },
    {
      category: "Selling",
      items: [
        {
          question: "How do I become a merchant?",
          answer: "Register through our Business Hub. You'll need to provide business documents, bank details, and complete our verification process. We'll guide you through product setup."
        },
        {
          question: "What commission does ChronoConnect take?",
          answer: "We take a 10-15% commission on sales, which covers our platform costs, delivery network, and customer support. Commission rates vary by product category."
        },
        {
          question: "How do I get paid?",
          answer: "Payments are processed weekly. You'll receive your earnings minus our commission directly to your registered bank account or mobile money."
        }
      ]
    },
    {
      category: "Technical",
      items: [
        {
          question: "The app is slow or not loading",
          answer: "Check your internet connection. Try refreshing the page or clearing your browser cache. For persistent issues, contact our technical support."
        },
        {
          question: "I can't access my account",
          answer: "Use the 'Forgot Password' feature or contact support. We'll help you regain access to your account securely."
        },
        {
          question: "How do I update my delivery address?",
          answer: "Go to your profile settings to update saved addresses. You can also add new delivery locations during checkout."
        }
      ]
    }
  ];

  const supportChannels = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us directly",
      contact: "+237 6XX XXX XXX",
      availability: "Mon-Fri: 8AM-6PM",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team",
      contact: "Available 24/7",
      availability: "Instant response",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email",
      contact: "support@chronoconnect.com",
      availability: "Response within 2 hours",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Our office",
      contact: "Douala, Cameroon",
      availability: "Mon-Fri: 9AM-5PM",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find answers to common questions, get support, and learn how to make the most of ChronoConnect
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/merchant">Business Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/delivery-agent">Delivery Support</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">Choose your preferred way to reach our support team</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-medium transition-shadow">
                <div className={`w-12 h-12 ${channel.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <channel.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{channel.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                <p className="font-medium text-foreground mb-1">{channel.contact}</p>
                <p className="text-xs text-muted-foreground">{channel.availability}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Find quick answers to common questions</p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {category.category}
                  </Badge>
                </div>
                {category.items.map((item, itemIndex) => (
                  <AccordionItem 
                    key={itemIndex} 
                    value={`${categoryIndex}-${itemIndex}`}
                    className="bg-white rounded-lg border mb-2"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <span className="text-left font-medium">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <p className="text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Quick Resources</h2>
            <p className="text-muted-foreground">Access helpful tools and information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Track Your Order</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get real-time updates on your delivery status
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/order/1">Track Now</Link>
              </Button>
            </Card>
            
            <Card className="p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Safety & Security</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Learn about our security measures and safety policies
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/safety">Learn More</Link>
              </Button>
            </Card>
            
            <Card className="p-6 hover:shadow-medium transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Terms & Privacy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Read our terms of service and privacy policy
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/terms">View Documents</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            Still need help? <Link to="/contact" className="underline hover:text-white">Contact our support team</Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Help; 