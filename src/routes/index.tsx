import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ModeToggle } from '@/components/mode-toggle'
import {
    BarChart3,
    Briefcase,
    Beaker,
    User,
    Users,
    Brain,
    FileText,
    Bot,
    Share2,
    Mail,
    RefreshCw, Bolt,
    Smartphone,
    Shapes,
    Users as UsersIcon, PlayCircle,
    BookOpen,
    CheckCircle,
    Github,
    Twitter,
    Linkedin
} from 'lucide-react'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    // Check if user is already authenticated via cookies
    const isAuthenticated = await context.auth.isAuthenticated();
    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: LandingPage,
})

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="py-6 px-4 md:px-12 flex justify-between items-center sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
            <BarChart3 className="text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">DigDeep</span>
        </div>
        
        <div className="hidden md:flex space-x-10">
          <a href="#features" className="font-medium hover:text-primary transition-colors">Features</a>
          <a href="#benefits" className="font-medium hover:text-primary transition-colors">Benefits</a>
          <a href="#audience" className="font-medium hover:text-primary transition-colors">Who's It For</a>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <Button onClick={() => navigate({ to: '/login' })}>Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-28 px-4 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <Badge variant="secondary" className="mb-4">
              AI-POWERED DATA ANALYSIS
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Unlock Insights from Your Data with <span className="text-primary">DigDeep</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              DigDeep uses advanced AI agents to perform deep, contextual analysis of your data. Extract meaningful insights from complex datasets through an intuitive interface.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" onClick={() => navigate({ to: '/login' })}>
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                <PlayCircle className="mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="relative max-w-md mx-auto">
              <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-accent/20 blur-3xl"></div>
              
              <Card className="relative p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-destructive mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm font-medium">AI Data Analysis</div>
                </div>
                
                <div className="mb-6">
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <div className="flex mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold mr-3">AI</div>
                      <div className="bg-muted-foreground/20 rounded-lg px-3 py-2 w-3/4 animate-pulse"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">Analyzing your dataset...</p>
                  </div>
                  
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold mr-3">U</div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2 w-full">
                      <p>Show me sales trends for Q2 and identify key growth opportunities</p>
                    </div>
                  </div>
                </div>
                
                <Card className="bg-gradient-to-r from-accent/50 to-primary/50 p-4">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-semibold">Sales Analysis Report</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                  <div className="flex items-center justify-around mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">24.5%</div>
                      <div className="text-xs text-muted-foreground">Q2 Growth</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">$1.2M</div>
                      <div className="text-xs text-muted-foreground">Total Revenue</div>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-muted-foreground">AI identified 3 key growth opportunities</p>
                </Card>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 md:px-12 bg-background">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Deep Data Analysis</h2>
          <p className="text-lg text-muted-foreground">DigDeep combines cutting-edge AI with intuitive tools to transform how you analyze data</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group hover:-translate-y-2 transition-all duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
                <FileText className="text-primary-foreground text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multi-Format Data Analysis</h3>
              <p className="text-muted-foreground mb-4">Handle CSV, images, text documents, and real-time data streams with powerful processing capabilities.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">Excel</Badge>
                <Badge variant="secondary">Images</Badge>
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">Real-time</Badge>
              </div>
            </div>
          </Card>

          <Card className="group hover:-translate-y-2 transition-all duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
                <Bot className="text-primary-foreground text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Agent Integration</h3>
              <p className="text-muted-foreground mb-4">Intelligent AI agents perform automated, goal-oriented analysis with contextual understanding and KPI tracking.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  Automated analysis tasks
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  Contextual understanding
                </li>
                <li className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  KPI generation & tracking
                </li>
              </ul>
            </div>
          </Card>

          <Card className="group hover:-translate-y-2 transition-all duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4">
                <Users className="text-primary-foreground text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Collaborative Features</h3>
              <p className="text-muted-foreground mb-4">Share files, integrate with email, manage sessions, and receive real-time updates for seamless teamwork.</p>
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <Share2 className="text-2xl text-accent mb-1" />
                  <span className="text-xs">File Sharing</span>
                </div>
                <div className="flex flex-col items-center">
                  <Mail className="text-2xl text-accent mb-1" />
                  <span className="text-xs">Email Integration</span>
                </div>
                <div className="flex flex-col items-center">
                  <RefreshCw className="text-2xl text-accent mb-1" />
                  <span className="text-xs">Real-time Updates</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 px-4 md:px-12 bg-accent/5">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Transform How You Work with Data</h2>
          <p className="text-lg text-muted-foreground">DigDeep delivers tangible benefits that accelerate your data analysis workflow</p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-background/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bolt className="text-primary text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Efficiency</h3>
              <p className="text-muted-foreground mb-4">Automated analysis and quick insight generation save valuable time in your workflow.</p>
              <div className="text-3xl font-bold text-primary">70%</div>
              <div className="text-sm text-muted-foreground">reduction in analysis time</div>
            </div>
          </Card>

          <Card className="bg-background/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Smartphone className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Accessibility</h3>
              <p className="text-muted-foreground mb-4">User-friendly interface and cross-device compatibility make insights available anywhere.</p>
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">cross-platform compatibility</div>
            </div>
          </Card>

          <Card className="bg-background/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Shapes className="text-green-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Flexibility</h3>
              <p className="text-muted-foreground mb-4">Support for multiple data sources and customizable goals adapts to your specific needs.</p>
              <div className="text-3xl font-bold text-green-600">12+</div>
              <div className="text-sm text-muted-foreground">data formats supported</div>
            </div>
          </Card>

          <Card className="bg-background/80 backdrop-blur-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Users className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Collaboration</h3>
              <p className="text-muted-foreground mb-4">Easy sharing and team features ensure everyone stays on the same page.</p>
              <div className="text-3xl font-bold text-red-600">10x</div>
              <div className="text-sm text-muted-foreground">faster team alignment</div>
            </div>
          </Card>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="audience" className="py-16 px-4 md:px-12 bg-background">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Designed for Data Professionals</h2>
          <p className="text-lg text-muted-foreground">DigDeep empowers teams across industries to unlock deeper insights</p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-3">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Data Analysts</h3>
              </div>
              <p className="text-muted-foreground">Accelerate your analysis workflow with AI-powered insights and automated reporting.</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white mr-3">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Business Intelligence</h3>
              </div>
              <p className="text-muted-foreground">Transform raw data into actionable business intelligence with automated KPI tracking.</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                  <Beaker className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Research Teams</h3>
              </div>
              <p className="text-muted-foreground">Uncover patterns and insights in complex research data with contextual AI analysis.</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white mr-3">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Decision Makers</h3>
              </div>
              <p className="text-muted-foreground">Access clear, actionable insights to drive strategic business decisions with confidence.</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white mr-3">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Data Scientists</h3>
              </div>
              <p className="text-muted-foreground">Enhance your models with AI-powered feature discovery and pattern recognition.</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-3">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Cross-functional Teams</h3>
              </div>
              <p className="text-muted-foreground">Collaborate seamlessly across departments with shared insights and visualizations.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-12 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Data Analysis Revolution Today</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-muted-foreground">Join thousands of professionals who have transformed how they work with data using DigDeep's AI-powered platform.</p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="glow" onClick={() => navigate({ to: '/login' })}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg">
              <BookOpen className="mr-2 h-5 w-5" />
              View Documentation
            </Button>
          </div>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-primary" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-primary" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-12 bg-secondary text-secondary-foreground">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
              <BarChart3 className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-secondary-foreground">DigDeep</span>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-muted-foreground hover:text-secondary-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-secondary-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-secondary-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-secondary-foreground/10 text-center text-sm">
          <p>&copy; 2025 DigDeep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
