import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
    Database,
    Sparkles,
    PlayCircle,
    ArrowRight,
    Bot,
    FileText,
    Share2,
    Brain,
    Zap,
    Github,
    Twitter,
    Linkedin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/')({
    component: LandingPage,
})

const REDIRECT_URL = 'https://treatmentgps.com/home/'

// --- Components ---

function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
    const navigate = useNavigate()

    const handleAuthAction = () => {
        if (isAuthenticated) {
            navigate({ to: '/dashboard' })
        } else {
            window.location.href = REDIRECT_URL
        }
    }

    return (
        <nav className="sticky top-0 left-0 right-0 z-50 flex justify-center p-4 md:p-6 pointer-events-none">
            <div className="flex w-full max-w-7xl items-center justify-between glass rounded-3xl px-6 py-4 transition-all duration-300 pointer-events-auto shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-2 group cursor-pointer shrink-0">
                    <div className="relative w-10 h-10 rounded-2xl bg-primary flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-primary/20">
                        <Database className="text-primary-foreground size-5" />
                        <Sparkles className="absolute -top-1 -right-1 size-4 text-accent animate-pulse" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">DigDeep</span>
                </div>

                <div className="hidden md:flex items-center gap-8 px-4">
                    {['Features', 'Benefits', 'Audience'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group whitespace-nowrap"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <ModeToggle />
                    <Button
                        onClick={handleAuthAction}
                        className="rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Log in'}
                    </Button>
                </div>
            </div>
        </nav>
    )
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
    const navigate = useNavigate()

    const handleAuthAction = () => {
        if (isAuthenticated) {
            navigate({ to: '/dashboard' })
        } else {
            window.location.href = REDIRECT_URL
        }
    }

    return (
        <section className="relative pt-16 pb-16 md:pt-16 md:pb-32 px-4 overflow-hidden mesh-gradient-light">
            {/* Decorative Orbs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-700"></div>

            <div className="max-w-7xl mx-auto text-center relative z-10">
                <Badge variant="secondary" className="mb-6 py-1.5 px-6 rounded-full bg-primary/10 text-primary border-primary/20 animate-in fade-in slide-in-from-bottom-3 duration-1000">
                    ✨ Redefining Data Analysis
                </Badge>

                <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    Unearth the Story <br />
                    <span className="text-gradient">Behind Your Data</span>
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300 leading-relaxed">
                    DigDeep uses sophisticated AI agents to traverse complex datasets, uncovering hidden patterns and actionable insights that standard tools miss.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400">
                    <Button
                        size="lg"
                        onClick={handleAuthAction}
                        className="h-14 px-8 rounded-2xl text-lg shadow-2xl shadow-primary/20 hover:scale-105 transition-all group"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Start Exploring'}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg glass">
                        <PlayCircle className="mr-2" />
                        Watch Product Tour
                    </Button>
                </div>

                {/* Dashboard Preview mockup */}
                <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden glass shadow-2xl animate-in fade-in zoom-in-95 duration-1000 delay-500 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none"></div>
                    <div className="h-12 bg-muted/50 border-b border-border/20 flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        <div className="ml-4 h-6 w-48 bg-muted/40 rounded-lg border border-border/10"></div>
                    </div>
                    <div className="p-8 grid grid-cols-12 gap-6 bg-muted/30 backdrop-blur-md">
                        <div className="col-span-8 space-y-4">
                            <div className="h-40 glass rounded-2xl relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-32 glass rounded-2xl"></div>
                                <div className="h-32 glass rounded-2xl"></div>
                            </div>
                        </div>
                        <div className="col-span-4 space-y-4">
                            <div className="h-full glass rounded-2xl p-6">
                                <div className="w-full h-4 bg-muted rounded-full mb-4"></div>
                                <div className="w-3/4 h-4 bg-muted rounded-full mb-4"></div>
                                <div className="w-full h-4 bg-muted rounded-full mb-4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}


const features = [
    {
        title: "AI Agent Autonomy",
        description: "Intelligent agents that don't just find data, but understand its context and business impact.",
        icon: Bot,
        className: "col-span-12 md:col-span-8 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent",
        visual: (
            <div className="mt-6 relative h-48 glass rounded-2xl border-primary/10 overflow-hidden flex items-center justify-center group/visual">
                <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                <div className="relative flex flex-col items-center gap-3">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                                <div className="w-full h-full bg-primary animate-shimmer" style={{ animationDelay: `${i * 200}ms` }}></div>
                            </div>
                        ))}
                    </div>
                    <Bot className="size-20 text-primary transition-transform duration-500 group-hover/visual:scale-110" />
                    <div className="px-4 py-1.5 glass rounded-full text-[10px] font-bold text-primary uppercase tracking-tighter">Processing Neural Patterns</div>
                </div>
            </div>
        )
    },
    {
        title: "Multi-Format Core",
        description: "Analyze CSVs, PDFs, and raw images seamlessly.",
        icon: FileText,
        className: "col-span-12 md:col-span-4 bg-muted/30",
        visual: (
            <div className="mt-6 flex flex-col gap-3 p-4 glass rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-[10px]">PDF</div>
                    <div className="h-2 w-full bg-muted rounded-full"></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-[10px]">CSV</div>
                    <div className="h-2 w-2/3 bg-muted rounded-full"></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">IMG</div>
                    <div className="h-2 w-1/2 bg-muted rounded-full"></div>
                </div>
            </div>
        )
    },
    {
        title: "Instant Collaboration",
        description: "Share workspaces and insights with your team in real-time.",
        icon: Share2,
        className: "col-span-12 md:col-span-4 bg-muted/30",
        visual: (
            <div className="mt-6 relative h-32 flex items-center justify-center">
                <div className="absolute size-24 rounded-full border border-dashed border-primary/30 animate-spin-slow"></div>
                <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="size-10 rounded-full glass border-2 border-border flex items-center justify-center text-[10px] font-bold text-primary">U{i}</div>
                    ))}
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white"><Zap className="size-4" /></div>
                </div>
            </div>
        )
    },
    {
        title: "Contextual Brain",
        description: "Our AI learns from your historical data to provide increasingly relevant insights.",
        icon: Brain,
        className: "col-span-12 md:col-span-8 bg-gradient-to-br from-accent/10 via-accent/[0.02] to-transparent",
        visual: (
            <div className="mt-6 relative h-48 glass rounded-2xl border-accent/20 overflow-hidden flex items-center justify-center group/visual bg-accent/[0.03]">
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Pulsing rings */}
                    <div className="absolute size-32 rounded-full border border-accent/20 animate-ping duration-1000"></div>
                    <div className="absolute size-48 rounded-full border border-accent/10 animate-ping duration-1000 delay-300"></div>

                    {/* Intelligence nodes */}
                    <div className="absolute inset-0 p-8 grid grid-cols-4 grid-rows-2 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="glass border-accent/10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover/visual:bg-accent/10"
                                style={{ animationDelay: `${i * 150}ms` }}
                            >
                                <div className="size-2 rounded-full bg-accent/40 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative size-24 rounded-3xl glass flex items-center justify-center border-accent/40 shadow-xl shadow-accent/5 transition-all duration-700 group-hover/visual:scale-110 group-hover/visual:border-accent/60">
                    <Brain className="size-14 text-accent" />
                    <div className="absolute -top-2 -right-2 size-6 rounded-full bg-accent flex items-center justify-center shadow-lg">
                        <Sparkles className="size-3.5 text-white" />
                    </div>
                </div>
            </div>
        )
    }
]

function FeaturesSection() {
    return (
        <section id="features" className="py-32 px-4 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <Badge variant="outline" className="mb-4 rounded-full border-primary/20 text-primary font-bold tracking-widest uppercase text-[10px]">Capabilities</Badge>
                    <h3 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight">Powerful Features, <br /><span className="text-muted-foreground">Unrivaled Depth</span></h3>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                        Everything you need to transform raw data into a competitive advantage with our autonomous agent architecture.
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {features.map((feature, i) => (
                        <Card key={i} className={`group p-8 border border-border/50 shadow-sm rounded-3xl ${feature.className} hover:border-primary/20 transition-all duration-500 overflow-hidden relative`}>
                            <div className="flex flex-col h-full relative z-10">
                                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                                    <feature.icon className="size-6 text-primary" />
                                </div>
                                <h4 className="text-2xl font-bold mb-3 tracking-tight">{feature.title}</h4>
                                <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">{feature.description}</p>
                                {feature.visual}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

function CTASection({ isAuthenticated }: { isAuthenticated: boolean }) {
    const navigate = useNavigate()

    const handleAuthAction = () => {
        if (isAuthenticated) {
            navigate({ to: '/dashboard' })
        } else {
            window.location.href = REDIRECT_URL
        }
    }

    return (
        <section className="py-24 px-4">
            <div className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 blur-[100px] -ml-32 -mb-32"></div>

                <div className="relative z-10">
                    <Sparkles className="size-16 text-primary mx-auto mb-8 animate-spin-slow" />
                    <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to Dig Deeper?</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join 10,000+ data professionals who are already uncovering hidden insights with DigDeep.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={handleAuthAction}
                            className="h-14 px-10 rounded-2xl text-lg shadow-xl shadow-primary/30 hover:scale-105 transition-all"
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Claim Your Free Trial'}
                        </Button>
                        <Button variant="ghost" size="lg" className="h-14 px-10 rounded-2xl text-lg">
                            Contact Sales
                        </Button>
                    </div>
                    <p className="mt-8 text-sm text-muted-foreground">
                        No credit card required. Cancel anytime.
                    </p>
                </div>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="py-20 px-4 bg-background border-t">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                            <Database className="text-primary-foreground size-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">DigDeep</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        The next generation of AI-powered data analysis. Uncovering truth in complexity.
                    </p>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Product</h4>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Enterprise</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Company</h4>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6">Connect</h4>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-2xl glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                            <Twitter className="size-5" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-2xl glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                            <Linkedin className="size-5" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-2xl glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                            <Github className="size-5" />
                        </a>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                © 2025 DigDeep. Crafted with passion by DigDeep Team.
            </div>
        </footer>
    )
}

export function LandingPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = await auth.isAuthenticated()
            setIsAuthenticated(isAuth)
        }
        checkAuth()
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground scroll-smooth">
            <Navbar isAuthenticated={isAuthenticated} />
            <main>
                <HeroSection isAuthenticated={isAuthenticated} />
                <FeaturesSection />
                <CTASection isAuthenticated={isAuthenticated} />
            </main>
            <Footer />
        </div>
    )
}