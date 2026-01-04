
import { ArrowRight, CheckCircle2, Star, Sparkles, Users } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden bg-slate-50 pt-20">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-20 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-bold mb-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    The #1 Platform for Event Staffing
                </span>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
                  Make your event <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600">
                    unforgettable.
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Whether you're hosting a gala or looking for your next gig, EventEase connects the best talent with the best parties. Instantly.
                </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full sm:w-auto"
              >
                <Button 
                    size="lg" 
                    onClick={onGetStarted} 
                    className="w-full h-14 px-8 text-lg font-bold rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-sm font-medium text-gray-500">
                <div className="flex items-center">
                    <div className="flex -space-x-2 mr-3">
                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User" />
                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="User" />
                        <img className="w-8 h-8 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="User" />
                    </div>
                    <span>10k+ Pros</span>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-2" />
                    <span>4.9/5 Rating</span>
                </div>
            </div>
          </div>

          {/* Image Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/20 bg-white p-2 rotate-2 hover:rotate-0 transition-all duration-500">
                <img
                    src="https://images.unsplash.com/photo-1765961009441-96d705184807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmVyZ2V0aWMlMjBldmVudCUyMHN0YWZmJTIwdGVhbSUyMGhhcHB5fGVufDF8fHx8MTc2NzUwMjEzMXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Event Staff"
                    className="w-full h-[600px] object-cover rounded-2xl"
                />
                
                {/* Floating Cards */}
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                >
                    <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Shift Filled</p>
                        <p className="text-xs text-gray-500">Just now</p>
                    </div>
                </motion.div>

                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 -right-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
                >
                    <div className="bg-violet-100 p-2 rounded-full">
                        <Users className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">5 New Applicants</p>
                        <p className="text-xs text-gray-500">For "Bartender"</p>
                    </div>
                </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
