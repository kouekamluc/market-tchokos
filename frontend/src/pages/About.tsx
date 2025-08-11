import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Target, 
  Users, 
  Globe, 
  Award, 
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

const About = () => {
  const missionValues = [
    {
      icon: Heart,
      title: "Community First",
      description: "We believe in empowering local communities by connecting them through technology",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Constantly innovating to solve real-world problems with cutting-edge technology",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Users,
      title: "Trust & Safety",
      description: "Building trust through transparency, security, and reliable service delivery",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Globe,
      title: "Local Impact",
      description: "Creating economic opportunities and digital transformation in African markets",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "Foundation",
      description: "ChronoConnect was founded with a vision to digitize commerce in Cameroon",
      achievement: "Company established"
    },
    {
      year: "2025",
      title: "MVP Launch",
      description: "Launched our first version with core marketplace and delivery features",
      achievement: "Platform launched"
    },
    {
      year: "2025",
      title: "Market Expansion",
      description: "Expanded to multiple cities across Cameroon",
      achievement: "5 cities covered"
    },
    {
      year: "2026",
      title: "Regional Growth",
      description: "Expanding to neighboring countries in Central Africa",
      achievement: "Regional presence"
    }
  ];

  const teamMembers = [
    {
      name: "Sarah Mbah",
      role: "CEO & Founder",
      bio: "Former tech executive with 10+ years experience in e-commerce and logistics",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      linkedin: "#"
    },
    {
      name: "David Nkeng",
      role: "CTO",
      bio: "Full-stack developer and systems architect with expertise in scalable platforms",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      linkedin: "#"
    },
    {
      name: "Marie Tchokouani",
      role: "Head of Operations",
      bio: "Operations specialist with deep knowledge of African logistics and supply chains",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      linkedin: "#"
    },
    {
      name: "Jean-Pierre Abega",
      role: "Head of Business Development",
      bio: "Business strategist focused on merchant partnerships and market expansion",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      linkedin: "#"
    }
  ];

  const stats = [
    {
      number: "10,000+",
      label: "Happy Customers",
      icon: Users
    },
    {
      number: "500+",
      label: "Active Merchants",
      icon: TrendingUp
    },
    {
      number: "200+",
      label: "Delivery Partners",
      icon: MapPin
    },
    {
      number: "5",
      label: "Cities Served",
      icon: Globe
    }
  ];

  const achievements = [
    {
      title: "Best Startup 2024",
      organization: "Cameroon Tech Awards",
      description: "Recognized for innovation in e-commerce and logistics",
      icon: Award
    },
    {
      title: "Digital Innovation Award",
      organization: "African Business Forum",
      description: "Awarded for our location-based delivery system",
      icon: Star
    },
    {
      title: "Community Impact",
      organization: "Local Business Association",
      description: "Recognized for empowering local merchants and farmers",
      icon: Heart
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">About ChronoConnect</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're on a mission to digitize and empower commerce in Cameroon and beyond. 
            Our platform connects communities through precise location-based delivery, 
            creating opportunities for merchants, farmers, and customers alike.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/careers">Join Our Team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission & Values</h2>
            <p className="text-muted-foreground">The principles that guide everything we do</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missionValues.map((value, index) => (
              <Card key={index} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${value.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <value.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Impact</h2>
            <p className="text-muted-foreground">Numbers that tell our story</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.number}</div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Story</h2>
            <p className="text-muted-foreground">How ChronoConnect came to be</p>
          </div>
          
          <div className="prose prose-lg mx-auto">
            <p className="text-muted-foreground leading-relaxed mb-6">
              ChronoConnect was born from a simple observation: while e-commerce was growing globally, 
              many African markets, particularly in Cameroon, still relied heavily on traditional 
              commerce methods. The challenge wasn't just about bringing commerce online—it was about 
              solving the unique challenges of African markets.
            </p>
            
            <p className="text-muted-foreground leading-relaxed mb-6">
              We noticed that formal addressing systems were often unreliable, making delivery a 
              significant challenge. Instead of trying to force existing solutions, we built something 
              new: a location-based delivery system that works with the reality of African cities.
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              Today, ChronoConnect is more than just a marketplace—it's an ecosystem that empowers 
              local businesses, creates jobs for delivery agents, and provides customers with 
              convenient access to goods and services. We're proud to be part of Africa's digital 
              transformation journey.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Journey</h2>
            <p className="text-muted-foreground">Key milestones in our growth</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">{milestone.year}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{milestone.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {milestone.achievement}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground">The passionate people behind ChronoConnect</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-medium transition-shadow">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-primary mb-3">{member.role}</p>
                <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Recognition & Awards</h2>
            <p className="text-muted-foreground">Acknowledgment of our impact and innovation</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <achievement.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{achievement.title}</h3>
                <p className="text-sm text-primary mb-2">{achievement.organization}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us in Building the Future</h2>
          <p className="text-gray-300 mb-8">
            Whether you're a customer, merchant, or delivery partner, there's a place for you in the ChronoConnect ecosystem.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" asChild>
              <Link to="/marketplace">Start Shopping</Link>
            </Button>
            <Button variant="outline" className="border-gray-300 text-white hover:bg-gray-800" asChild>
              <Link to="/merchant">Become a Merchant</Link>
            </Button>
            <Button variant="outline" className="border-gray-300 text-white hover:bg-gray-800" asChild>
              <Link to="/delivery-agent">Join as Delivery Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>123 Commerce Street, Douala, Cameroon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+237 6XX XXX XXX</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@chronoconnect.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4" />
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link to="/help" className="block text-gray-300 hover:text-white transition-colors">
                  Help Center
                </Link>
                <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
                <Link to="/careers" className="block text-gray-300 hover:text-white transition-colors">
                  Careers
                </Link>
                <Link to="/terms" className="block text-gray-300 hover:text-white transition-colors">
                  Terms & Privacy
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>&copy; 2025 ChronoConnect. Made with ❤️ for African commerce.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About; 