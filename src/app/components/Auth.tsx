import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Auth({ onLogin, onBackToHome }: { onLogin: (role: 'organizer' | 'staff') => void; onBackToHome?: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [selectedRole, setSelectedRole] = useState<'staff' | 'organizer'>('staff');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (role: 'organizer' | 'staff') => {
     if(!email || !password) {
       toast.error("Please enter email and password");
       return;
     }
     
     setLoading(true);
     
     try {
       // Sign in with Supabase Auth
       const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
         email,
         password,
       });

       if (authError) {
         toast.error(authError.message);
         setLoading(false);
         return;
       }

       // Get user profile to check role
       const { data: profile, error: profileError } = await supabase
         .from('user_profiles')
         .select('role')
         .eq('id', authData.user.id)
         .single();

       if (profileError) {
         toast.error("Error fetching user profile");
         setLoading(false);
         return;
       }

       // Check if the selected role matches the registered role
       if (profile.role !== role) {
         toast.error(`This account is registered as ${profile.role === 'organizer' ? 'an Organizer' : 'Staff'}. Please select the correct role.`);
         await supabase.auth.signOut();
         setLoading(false);
         return;
       }
       
       onLogin(role);
       toast.success(`Logged in as ${role}!`);
     } catch (error: any) {
       toast.error(error.message || "An error occurred during login");
     } finally {
       setLoading(false);
     }
  };

  const handleSignup = async (role: 'organizer' | 'staff') => {
    if(!email || !password || !fullName || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Better email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address (e.g., user@example.com)");
      return;
    }
    
    if(password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if(password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if(role === 'organizer' && !company) {
      toast.error("Please enter your company or organization name");
      return;
    }
    if(role === 'staff' && !location) {
      toast.error("Please enter your location so we can show you nearby jobs");
      return;
    }
    if(role === 'organizer' && !location) {
      toast.error("Please enter your location");
      return;
    }
    
    setLoading(true);

    try {
      console.log('Attempting signup with email:', email);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (authError) {
        console.error('Supabase Auth Error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('invalid') || authError.message.includes('email')) {
          toast.error("Please enter a valid email address. Make sure it's in the format: user@example.com");
        } else if (authError.message.includes('already registered')) {
          toast.error("This email is already registered. Please try logging in instead.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log('User created:', authData.user.id);

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: email.trim().toLowerCase(),
          role,
          full_name: fullName,
          phone,
          company: role === 'organizer' ? company : null,
          location: location || null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        toast.error(`Error creating user profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      onLogin(role);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh)] bg-slate-50 relative overflow-hidden px-4 pt-20 pb-12">
      
      {/* Back to Home Button */}
      {onBackToHome && (
        <Button
          variant="ghost"
          onClick={onBackToHome}
          className="absolute top-24 left-4 md:left-8 z-20 font-bold text-gray-700 hover:text-violet-600 hover:bg-violet-50 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      )}
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl shadow-violet-100 border-0 rounded-3xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
        <CardHeader className="text-center pt-8">
            <div className="mx-auto bg-violet-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {mode === 'login' ? (
                  <LogIn className="h-6 w-6 text-violet-600" />
                ) : (
                  <UserPlus className="h-6 w-6 text-violet-600" />
                )}
            </div>
          <CardTitle className="text-2xl font-black text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Enter your details to access your account' 
              : 'Fill in your information to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="staff" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">I want to work</TabsTrigger>
              <TabsTrigger value="organizer" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm">I need staff</TabsTrigger>
            </TabsList>
            
            {mode === 'login' ? (
              // Login Form
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-gray-700">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="font-bold text-gray-700">Password</Label>
                        <a href="#" className="text-xs font-bold text-violet-600 hover:text-violet-800">Forgot password?</a>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <TabsContent value="staff">
                  <Button 
                    className="w-full mt-6 h-12 rounded-xl text-lg font-bold bg-gray-900 hover:bg-violet-600 shadow-lg shadow-gray-200 transition-all" 
                    onClick={() => handleLogin('staff')}
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Log in as Staff'}
                  </Button>
                </TabsContent>
                <TabsContent value="organizer">
                  <Button 
                    className="w-full mt-6 h-12 rounded-xl text-lg font-bold bg-gray-900 hover:bg-violet-600 shadow-lg shadow-gray-200 transition-all" 
                    onClick={() => handleLogin('organizer')}
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Log in as Organizer'}
                  </Button>
                </TabsContent>
              </>
            ) : (
              // Signup Form
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="font-bold text-gray-700">Full Name</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      placeholder="John Doe" 
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-gray-700">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-gray-700">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <TabsContent value="staff" className="m-0">
                    <div className="space-y-2">
                      <Label htmlFor="staffLocation" className="font-bold text-gray-700">Your Location</Label>
                      <Input 
                        id="staffLocation" 
                        type="text" 
                        placeholder="e.g., San Francisco, CA" 
                        className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">We'll show you nearby job opportunities</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="organizer" className="m-0">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="font-bold text-gray-700">Company / Organization</Label>
                      <Input 
                        id="company" 
                        type="text" 
                        placeholder="Your Company Name" 
                        className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="font-bold text-gray-700">Location</Label>
                      <Input 
                        id="location" 
                        type="text" 
                        placeholder="Your Location" 
                        className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-bold text-gray-700">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Create a strong password"
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-bold text-gray-700">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Re-enter your password"
                      className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <TabsContent value="staff">
                  <Button 
                    className="w-full mt-6 h-12 rounded-xl text-lg font-bold bg-gray-900 hover:bg-violet-600 shadow-lg shadow-gray-200 transition-all" 
                    onClick={() => handleSignup('staff')}
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Staff Account'}
                  </Button>
                </TabsContent>
                <TabsContent value="organizer">
                  <Button 
                    className="w-full mt-6 h-12 rounded-xl text-lg font-bold bg-gray-900 hover:bg-violet-600 shadow-lg shadow-gray-200 transition-all" 
                    onClick={() => handleSignup('organizer')}
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Organizer Account'}
                  </Button>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50 py-4">
          <p className="text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <span 
                  className="font-bold text-violet-600 cursor-pointer hover:underline"
                  onClick={() => setMode('signup')}
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span 
                  className="font-bold text-violet-600 cursor-pointer hover:underline"
                  onClick={() => setMode('login')}
                >
                  Log in
                </span>
              </>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}