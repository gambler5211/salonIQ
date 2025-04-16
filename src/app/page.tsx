'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Loader2, Menu, X } from 'lucide-react';

export default function Home() {
  const [isLoading, setIsLoading] = useState({
    login: false,
    signup: false,
    trial: false
  });
  const [messageVisible, setMessageVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Add example WhatsApp messages that will rotate
  const exampleMessages = [
    { client: "Priya", message: "time to book your next haircut!", emoji: "💇‍♀️" },
    { client: "Rahul", message: "20% off on beard trimming this week!", emoji: "✂️" },
    { client: "Ananya", message: "missing your regular color service?", emoji: "🎨" },
    { client: "Arjun", message: "it's been 30 days since your last visit!", emoji: "📆" },
    { client: "Tanya", message: "we've launched a new hair spa treatment!", emoji: "✨" },
    { client: "Vikram", message: "how about trying our new styling package?", emoji: "💈" },
    { client: "Meera", message: "your regular appointment is due soon!", emoji: "⏰" },
    { client: "Rohan", message: "special discount for your next haircut!", emoji: "💰" }
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messageAnimation, setMessageAnimation] = useState('fade-in');

  useEffect(() => {
    // Show the WhatsApp message after a short delay
    const timer = setTimeout(() => {
      setMessageVisible(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Rotate through example messages every few seconds
  useEffect(() => {
    if (!messageVisible) return;
    
    const rotateMessages = setInterval(() => {
      setMessageAnimation('fade-out');
      
      // Change message after fade out animation
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => 
          prevIndex === exampleMessages.length - 1 ? 0 : prevIndex + 1
        );
        setMessageAnimation('fade-in');
      }, 500);
    }, 4000);
    
    return () => clearInterval(rotateMessages);
  }, [messageVisible, exampleMessages.length]);

  // Lightweight navigation function
  const navigate = (path: string, type: 'login' | 'signup' | 'trial') => {
    setIsLoading(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      window.location.href = path;
    }, 50); // Reduced timeout for faster navigation
  };

  // Scroll to "How It Works" section
  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu if open
    setMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center">
            <span className="text-3xl font-bold">Salon<span className="text-[#ff7b54]">IQ</span></span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login', 'login');
              }}
            >
              <Button 
                variant="ghost" 
                className="text-[#1e2c3a] hover:text-black"
                disabled={isLoading.login}
              >
                {isLoading.login ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : 'Log in'}
              </Button>
            </Link>
            <Link 
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate('/signup', 'signup');
              }}
            >
              <Button 
                className="bg-[#ff7b54] hover:bg-[#ff6a3d] text-white rounded-full px-8"
                disabled={isLoading.signup}
              >
                {isLoading.signup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : 'Get Started'}
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10" 
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white shadow-lg p-4 z-20 transition-all duration-300">
            <div className="flex flex-col gap-3">
              <Link 
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login', 'login');
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-center text-[#1e2c3a] hover:text-black py-3"
                  disabled={isLoading.login}
                >
                  {isLoading.login ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : 'Log in'}
                </Button>
              </Link>
              <Link 
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup', 'signup');
                  setMobileMenuOpen(false);
                }}
                className="w-full"
              >
                <Button 
                  className="w-full justify-center bg-[#ff7b54] hover:bg-[#ff6a3d] text-white py-3"
                  disabled={isLoading.signup}
                >
                  {isLoading.signup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : 'Get Started'}
                </Button>
              </Link>
              <Button 
                variant="ghost"
                className="w-full justify-center py-3"
                onClick={scrollToHowItWorks}
              >
                How It Works
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="relative min-h-screen flex items-center pt-20">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fff1e6] via-[#ffcdb2] to-[#ffb4a2] -z-10"></div>
          
          <div className="container mx-auto px-4 py-24 md:py-12 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-12 md:mb-0">
              <h1 className="text-5xl md:text-6xl font-bold text-[#0f1923] mb-6 leading-tight">
                Bring Your Salon<br />Clients Back
              </h1>
              <p className="text-xl md:text-2xl text-[#1a2836] mb-10 max-w-xl">
                Turn one-time visits into lasting relationships with your salon clients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link 
                  href="/signup"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signup', 'trial');
                  }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-[#ff7b54] to-[#ff6a3d] hover:from-[#ff6a3d] hover:to-[#ff5925] text-white text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full transform transition-all hover:scale-105 hover:shadow-lg"
                    disabled={isLoading.trial}
                  >
                    {isLoading.trial ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Loading...
                      </>
                    ) : 'Start Free Trial'}
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto text-[#1e2c3a] border-[#1e2c3a] text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-full hover:bg-[#1e2c3a]/5 transform transition-all hover:scale-105"
                  onClick={scrollToHowItWorks}
                >
                  See how it works
                </Button>
              </div>
              <div className="mt-8 flex items-center text-[#1a2836]">
                <span className="text-xl font-semibold mr-2">&ldquo;</span>
                <p className="text-lg">The smart way to retain salon clients</p>
                <span className="text-xl font-semibold ml-2">&rdquo;</span>
              </div>
            </div>
            
            <div className="md:w-1/2 relative">
              <div className="relative">
                <div 
                  className={`absolute top-5 right-5 z-10 bg-white rounded-lg p-4 shadow-lg max-w-xs transform transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                    messageVisible 
                      ? 'translate-x-0 opacity-100 animate-subtle-bounce' 
                      : 'translate-x-16 opacity-0'
                  }`}
                  onClick={() => {
                    // Force a message change on click
                    setMessageAnimation('fade-out');
                    setTimeout(() => {
                      setCurrentMessageIndex((prevIndex) => 
                        (prevIndex + 1) % exampleMessages.length
                      );
                      setMessageAnimation('fade-in');
                    }, 300);
                  }}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[#25d366] flex items-center justify-center mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="min-h-[80px] flex flex-col justify-between">
                      <div className={`text-sm text-gray-800 transition-opacity duration-500 ${messageAnimation === 'fade-in' ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="font-semibold">Hey {exampleMessages[currentMessageIndex].client}, it&apos;s</span><br />
                        {exampleMessages[currentMessageIndex].message} <span className="text-lg">{exampleMessages[currentMessageIndex].emoji}</span>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <div className="h-4 w-4 bg-[#ff7b54] rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-white rounded-full border-2 border-[#25d366] animate-ping opacity-75"></div>
                  
                  {/* Typing indicator */}
                  <div className="absolute bottom-2 left-14 flex space-x-1">
                    <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-1"></div>
                    <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-2"></div>
                    <div className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full animate-typing-3"></div>
                  </div>
                </div>
                
                <div className="relative z-0 shadow-xl rounded-xl overflow-hidden bg-white">
                  <img 
                    src="/salon-illustration.png" 
                    alt="Salon stylist cutting client's hair"
                    className="w-full h-auto rounded-xl"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white" id="how-it-works">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#ff7b54]/10 text-[#ff7b54] rounded-full flex items-center justify-center mb-4 font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2 text-[#0f1923]">Add Your Clients</h3>
                <p className="text-gray-700">Import your clients or add them manually with their service info and last visit date.</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#ff7b54]/10 text-[#ff7b54] rounded-full flex items-center justify-center mb-4 font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2 text-[#0f1923]">Set Up Campaigns</h3>
                <p className="text-gray-700">Create personalized message templates and set when to send follow-ups.</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#ff7b54]/10 text-[#ff7b54] rounded-full flex items-center justify-center mb-4 font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2 text-[#0f1923]">Retain More Clients</h3>
                <p className="text-gray-700">Watch your rebooking rate increase as clients receive timely reminders for their next appointment.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1e2c3a] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl font-bold mb-6">Salon<span className="text-[#ff7b54]">IQ</span></div>
            <p className="mb-8">The smart way to retain salon clients</p>
            <div className="flex justify-center space-x-6">
              <Link href="/login" className="hover:text-[#ff7b54] transition-colors">Login</Link>
              <Link href="/signup" className="hover:text-[#ff7b54] transition-colors">Sign Up</Link>
              <Link href="#" className="hover:text-[#ff7b54] transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#ff7b54] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
