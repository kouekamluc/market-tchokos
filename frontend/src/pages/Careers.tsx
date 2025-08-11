import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, 
  Users, 
  Heart, 
  Zap, 
  Globe, 
  Award,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Send,
  CheckCircle,
  ArrowRight,
  Building,
  Coffee,
  Wifi,
  Calendar,
  BookOpen
} from 'lucide-react';

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const openPositions = [
    {
      id: "senior-frontend",
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Douala, Cameroon",
      type: "Full-time",
      experience: "3+ years",
      salary: "Competitive",
      description: "We're looking for a Senior Frontend Developer to help build our React-based marketplace platform. You'll work on user-facing features, performance optimization, and mobile responsiveness.",
      requirements: [
        "Strong experience with React, TypeScript, and modern frontend frameworks",
        "Experience with state management (Redux, Zustand, etc.)",
        "Knowledge of responsive design and mobile-first development",
        "Experience with testing frameworks (Jest, React Testing Library)",
        "Understanding of performance optimization and web vitals"
      ],
      responsibilities: [
        "Develop and maintain user-facing features",
        "Collaborate with designers and backend developers",
        "Write clean, maintainable, and well-tested code",
        "Participate in code reviews and technical discussions",
        "Mentor junior developers"
      ]
    },
    {
      id: "backend-developer",
      title: "Backend Developer",
      department: "Engineering",
      location: "Douala, Cameroon",
      type: "Full-time",
      experience: "2+ years",
      salary: "Competitive",
      description: "Join our backend team to build scalable APIs and services that power our marketplace platform. You'll work with Django, PostgreSQL, and cloud infrastructure.",
      requirements: [
        "Experience with Python and Django/Django REST Framework",
        "Knowledge of PostgreSQL and database design",
        "Understanding of RESTful APIs and microservices",
        "Experience with cloud platforms (AWS, Azure, or GCP)",
        "Knowledge of Docker and containerization"
      ],
      responsibilities: [
        "Design and implement RESTful APIs",
        "Optimize database queries and performance",
        "Implement security best practices",
        "Write unit and integration tests",
        "Deploy and maintain services in production"
      ]
    },
    {
      id: "product-manager",
      title: "Product Manager",
      department: "Product",
      location: "Douala, Cameroon",
      type: "Full-time",
      experience: "3+ years",
      salary: "Competitive",
      description: "Drive product strategy and execution for our marketplace platform. You'll work closely with engineering, design, and business teams to deliver exceptional user experiences.",
      requirements: [
        "Experience in product management for digital platforms",
        "Strong analytical and problem-solving skills",
        "Experience with user research and data analysis",
        "Knowledge of agile development methodologies",
        "Excellent communication and stakeholder management skills"
      ],
      responsibilities: [
        "Define product strategy and roadmap",
        "Gather and prioritize user requirements",
        "Work with cross-functional teams to deliver features",
        "Analyze user data and market trends",
        "Coordinate product launches and go-to-market activities"
      ]
    },
    {
      id: "business-development",
      title: "Business Development Manager",
      department: "Business Development",
      location: "Douala, Cameroon",
      type: "Full-time",
      experience: "2+ years",
      salary: "Competitive + Commission",
      description: "Help us expand our merchant network and partnerships. You'll identify opportunities, build relationships, and drive growth in our target markets.",
      requirements: [
        "Experience in business development or sales",
        "Strong networking and relationship-building skills",
        "Knowledge of the local business landscape",
        "Excellent communication and presentation skills",
        "Results-driven with a track record of meeting targets"
      ],
      responsibilities: [
        "Identify and pursue new business opportunities",
        "Build and maintain relationships with merchants",
        "Negotiate partnerships and agreements",
        "Develop and execute growth strategies",
        "Track and report on business development metrics"
      ]
    },
    {
      id: "customer-success",
      title: "Customer Success Specialist",
      department: "Customer Success",
      location: "Douala, Cameroon",
      type: "Full-time",
      experience: "1+ years",
      salary: "Competitive",
      description: "Ensure our customers have an exceptional experience with ChronoConnect. You'll provide support, gather feedback, and help customers succeed.",
      requirements: [
        "Excellent customer service skills",
        "Strong communication abilities",
        "Problem-solving and analytical thinking",
        "Experience with CRM systems",
        "Patience and empathy for customer needs"
      ],
      responsibilities: [
        "Provide customer support via multiple channels",
        "Onboard new customers and merchants",
        "Gather and analyze customer feedback",
        "Identify opportunities for product improvement",
        "Maintain customer relationships and satisfaction"
      ]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Competitive Salary",
      description: "We offer competitive compensation packages with regular reviews and bonuses"
    },
    {
      icon: Calendar,
      title: "Flexible Work",
      description: "Flexible working hours and remote work options when possible"
    },
    {
      icon: GraduationCap,
      title: "Learning & Growth",
      description: "Continuous learning opportunities, conferences, and skill development"
    },
    {
      icon: Heart,
      title: "Health Benefits",
      description: "Comprehensive health insurance and wellness programs"
    },
    {
      icon: Coffee,
      title: "Great Environment",
      description: "Modern office with free coffee, snacks, and collaborative spaces"
    },
    {
      icon: Award,
      title: "Career Growth",
      description: "Clear career progression paths and mentorship programs"
    }
  ];

  const cultureValues = [
    {
      icon: Users,
      title: "Collaboration",
      description: "We believe in the power of teamwork and diverse perspectives"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We encourage creative thinking and experimentation"
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We put our users and community first in everything we do"
    },
    {
      icon: Globe,
      title: "Impact",
      description: "We're driven by the positive impact we create in our communities"
    }
  ];

  const handleApply = (jobId: string) => {
    setSelectedJob(jobId);
    setIsApplying(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate application submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsApplying(false);
    setSelectedJob(null);
    // Show success message
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Join Our Team</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            Help us build the future of commerce in Africa. We're looking for passionate, 
            talented individuals who want to make a real impact in their communities.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <a href="#open-positions">View Open Positions</a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/about">Learn About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Culture & Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Culture</h2>
            <p className="text-muted-foreground">The values that make ChronoConnect special</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cultureValues.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-medium transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Work With Us</h2>
            <p className="text-muted-foreground">Benefits and perks that make ChronoConnect a great place to work</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="open-positions" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Open Positions</h2>
            <p className="text-muted-foreground">Join our growing team and help shape the future of commerce</p>
          </div>
          
          <div className="space-y-6">
            {openPositions.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-medium transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{job.department}</Badge>
                          <Badge variant="outline">{job.type}</Badge>
                          <Badge variant="outline">{job.experience}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="text-sm font-medium text-foreground">{job.salary}</div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Requirements</h4>
                        <ul className="space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Responsibilities</h4>
                        <ul className="space-y-1">
                          {job.responsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              {resp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:flex-shrink-0">
                    <Button onClick={() => handleApply(job.id)} className="w-full lg:w-auto">
                      Apply Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Apply for Position</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsApplying(false)}
                >
                  ×
                </Button>
              </div>
              
              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Select value={selectedJob} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {openPositions.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="coverLetter">Cover Letter *</Label>
                  <Textarea 
                    id="coverLetter" 
                    rows={4}
                    placeholder="Tell us why you're interested in this position and what you can bring to the team..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="resume">Resume/CV *</Label>
                  <Input id="resume" type="file" accept=".pdf,.doc,.docx" required />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button type="submit" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Application
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsApplying(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Call to Action */}
      <section className="py-16 bg-foreground text-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See the Right Fit?</h2>
          <p className="text-background/80 mb-8">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button variant="outline" className="border-background/20 text-background hover:bg-background/10" asChild>
              <a href="mailto:careers@chronoconnect.com">
                careers@chronoconnect.com
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers; 