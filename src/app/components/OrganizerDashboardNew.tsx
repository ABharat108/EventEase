import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, Clock, MapPin, Star, Plus, Eye, UserCheck, Briefcase, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

export function OrganizerDashboard({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAssignEventModalOpen, setIsAssignEventModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [applicantToAssign, setApplicantToAssign] = useState<any>(null);
  const [applicantToReview, setApplicantToReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  
  // Track rejected and accepted applicants
  const [rejectedApplicantIds, setRejectedApplicantIds] = useState<number[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<{[key: number]: number}>({});
  
  // Data states
  const [myPostings, setMyPostings] = useState<any[]>([]);
  const [recentApplicants, setRecentApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [databaseSetupMissing, setDatabaseSetupMissing] = useState(false);
  
  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobStartDate, setJobStartDate] = useState('');
  const [jobEndDate, setJobEndDate] = useState('');
  const [jobStartTime, setJobStartTime] = useState('');
  const [jobEndTime, setJobEndTime] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [positionsNeeded, setPositionsNeeded] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [jobRole, setJobRole] = useState('');

  // Fetch data from Supabase
  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        return;
      }
      setUserId(user.id);

      // Fetch job postings
      const { data: postings, error: postingsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (postingsError) {
        // Check if table doesn't exist
        if (postingsError.code === 'PGRST205') {
          console.error('Database tables not set up. Please run the SQL setup script.');
          toast.error('Database setup required. Please contact your administrator.');
          setDatabaseSetupMissing(true);
          setMyPostings([]);
          setRecentApplicants([]);
          setLoading(false);
          return;
        }
        throw postingsError;
      }
      setMyPostings(postings || []);

      // Fetch applications for organizer's postings
      if (postings && postings.length > 0) {
        const postingIds = postings.map(p => p.id);
        const { data: applications, error: applicationsError } = await supabase
          .from('applications')
          .select(`
            *,
            job_postings!inner(id, title, organizer_id),
            user_profiles!inner(id, full_name, email, phone)
          `)
          .in('job_id', postingIds)
          .order('created_at', { ascending: false});

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          setRecentApplicants([]);
        } else {
          setRecentApplicants(applications || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic stats
  const stats = [
    { 
      title: 'Active Postings', 
      value: myPostings.filter(p => p.status === 'active').length.toString(), 
      icon: Calendar, 
      color: 'bg-violet-500' 
    },
    { 
      title: 'Total Applicants', 
      value: recentApplicants.length.toString(), 
      icon: Users, 
      color: 'bg-fuchsia-500' 
    },
    { 
      title: 'Hired This Month', 
      value: recentApplicants.filter(a => a.status === 'accepted').length.toString(), 
      icon: UserCheck, 
      color: 'bg-green-500' 
    },
    { 
      title: 'Total Spent', 
      value: '$0', 
      icon: DollarSign, 
      color: 'bg-amber-500' 
    },
  ];

  const handlePostJob = async () => {
    if (!jobTitle || !jobStartDate || !jobLocation || !positionsNeeded || !hourlyRate || !jobRole) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          organizer_id: userId,
          title: jobTitle,
          description: jobDescription,
          start_date: jobStartDate,
          end_date: jobEndDate || jobStartDate,
          start_time: jobStartTime,
          end_time: jobEndTime,
          location: jobLocation,
          positions_needed: parseInt(positionsNeeded),
          hourly_rate: parseInt(hourlyRate.replace(/[^0-9]/g, '')),
          role: jobRole,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Job posted successfully!');
      setIsPostJobModalOpen(false);
      
      // Reset form
      setJobTitle('');
      setJobDescription('');
      setJobStartDate('');
      setJobEndDate('');
      setJobStartTime('');
      setJobEndTime('');
      setJobLocation('');
      setPositionsNeeded('');
      setHourlyRate('');
      setJobRole('');
      
      // Refresh data
      fetchOrganizerData();
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    }
  };

  const handleEditPosting = (posting: any) => {
    setSelectedPosting(posting);
    setJobTitle(posting.title);
    setJobStartDate(posting.start_date);
    setJobEndDate(posting.end_date);
    setJobLocation(posting.location);
    setPositionsNeeded(posting.positions_needed.toString());
    setHourlyRate(posting.hourlyRate);
    setIsEditModalOpen(true);
  };

  const handleUpdatePosting = () => {
    toast.success('Job posting updated successfully!');
    setIsEditModalOpen(false);
  };

  const handleViewApplicants = (posting: any) => {
    setSelectedPosting(posting);
    setIsApplicantsModalOpen(true);
  };

  const handleAcceptApplicant = (applicant: any) => {
    const activePostings = myPostings.filter(p => p.status === 'active');
    
    if (activePostings.length > 1) {
      setApplicantToAssign(applicant);
      setIsAssignEventModalOpen(true);
    } else if (activePostings.length === 1) {
      const postingId = activePostings[0].id;
      toast.success(`${applicant.user_profiles.full_name} has been hired for ${activePostings[0].title}!`);
      setAcceptedApplicants(prev => ({...prev, [applicant.id]: postingId}));
      setRejectedApplicantIds(prev => prev.filter(id => id !== applicant.id));
      
      setMyPostings(prev => prev.map(posting => 
        posting.id === postingId 
          ? { 
              ...posting, 
              hired: (posting.hired || 0) + 1,
              status: (posting.hired || 0) + 1 >= posting.positions_needed ? 'filled' : posting.status
            }
          : posting
      ));
    } else {
      toast.error('No active job postings available');
    }
  };

  const handleAssignToEvent = (postingId: number) => {
    if (!applicantToAssign) return;
    
    const posting = myPostings.find(p => p.id === postingId);
    toast.success(`${applicantToAssign.user_profiles.full_name} has been hired for ${posting?.title}!`);
    setAcceptedApplicants(prev => ({...prev, [applicantToAssign.id]: postingId}));
    setRejectedApplicantIds(prev => prev.filter(id => id !== applicantToAssign.id));
    
    setMyPostings(prev => prev.map(p => 
      p.id === postingId 
        ? { 
            ...p, 
            hired: (p.hired || 0) + 1,
            status: (p.hired || 0) + 1 >= p.positions_needed ? 'filled' : p.status
          }
        : p
    ));
    
    setIsAssignEventModalOpen(false);
    setApplicantToAssign(null);
  };

  const handleRejectApplicant = (applicant: any) => {
    const wasAccepted = acceptedApplicants[applicant.id];
    
    setRejectedApplicantIds(prev => [...prev, applicant.id]);
    setAcceptedApplicants(prev => {
      const newAcceptedApplicants = {...prev};
      delete newAcceptedApplicants[applicant.id];
      return newAcceptedApplicants;
    });
    
    if (wasAccepted) {
      setMyPostings(prev => prev.map(posting => 
        posting.id === wasAccepted 
          ? { 
              ...posting, 
              hired: Math.max(0, (posting.hired || 0) - 1),
              status: (posting.hired || 0) - 1 < posting.positions_needed ? 'active' : posting.status
            }
          : posting
      ));
    }
    
    toast.error(`${applicant.user_profiles.full_name}'s application has been rejected`);
  };

  const handleViewProfile = (applicant: any) => {
    setSelectedApplicant(applicant);
    setIsProfileModalOpen(true);
  };

  const handleReviewStaff = (applicant: any) => {
    setApplicantToReview(applicant);
    setReviewRating(0);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!applicantToReview || reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmittingReview(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to submit a review');
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          organizer_id: user.id,
          staff_id: applicantToReview.applicant_id,
          job_id: applicantToReview.job_id,
          application_id: applicantToReview.id,
          rating: reviewRating,
          comment: reviewComment,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('You have already reviewed this staff member for this job');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted successfully!');
        setIsReviewModalOpen(false);
        setApplicantToReview(null);
        setReviewRating(0);
        setReviewComment('');
        
        // Add to existing reviews
        setExistingReviews(prev => [...prev, {
          staff_id: applicantToReview.applicant_id,
          job_id: applicantToReview.job_id
        }]);
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasReviewed = (applicant: any) => {
    return existingReviews.some(
      r => r.staff_id === applicant.applicant_id && r.job_id === applicant.job_id
    );
  };

  const getApplicantsForPosting = (postingId: number) => {
    return recentApplicants.filter(app => app.job_id === postingId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'TBD';
    const start = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const end = new Date(`2000-01-01T${endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-gray-600 font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30">
      {/* Header Section with Gradient */}
      <div className="relative bg-gradient-to-r from-violet-600 via-violet-700 to-fuchsia-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                Welcome back! 👋
              </h1>
              <p className="text-violet-100 text-lg">
                Manage your events and find the perfect team
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button 
                onClick={() => {
                  setJobRole('');
                  setIsPostJobModalOpen(true);
                }}
                size="lg"
                className="bg-white text-violet-700 hover:bg-violet-50 shadow-2xl shadow-violet-900/20 rounded-2xl px-8 h-14 font-bold text-lg group transition-all duration-300"
              >
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Post a New Job
              </Button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={idx} 
                  className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl shadow-violet-900/10 border border-white/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {stat.value}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        <Tabs defaultValue="postings" className="space-y-6">
          <TabsList className="bg-white rounded-2xl p-2 shadow-xl border border-gray-100 h-auto">
            <TabsTrigger 
              value="postings" 
              className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white font-bold data-[state=active]:shadow-lg transition-all"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              My Postings
            </TabsTrigger>
            <TabsTrigger 
              value="applicants" 
              className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white font-bold data-[state=active]:shadow-lg transition-all"
            >
              <Users className="h-4 w-4 mr-2" />
              Recent Applicants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postings" className="space-y-6">
            {/* Job Postings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myPostings.filter(p => p.status === 'active' || p.status === 'filled').map((posting, idx) => (
                <motion.div 
                  key={posting.id} 
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-violet-200 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <Badge 
                      className={`rounded-full font-bold ${
                        posting.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {posting.status.charAt(0).toUpperCase() + posting.status.slice(1)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPosting(posting)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Job Title */}
                  <h3 className="font-black text-xl text-gray-900 mb-4 line-clamp-2">
                    {posting.title}
                  </h3>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="font-bold text-gray-900">{formatDate(posting.start_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-fuchsia-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Time</span>
                        <span className="font-bold text-gray-900">{formatTime(posting.start_time, posting.end_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Location</span>
                        <span className="font-bold text-gray-900">{posting.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Rate</span>
                        <span className="font-bold text-gray-900">${posting.hourly_rate}/hr</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-black text-violet-600">{getApplicantsForPosting(posting.id).length}</p>
                      <p className="text-xs text-gray-500 font-bold">Applicants</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-black text-fuchsia-600">{posting.hired || 0}/{posting.positions_needed}</p>
                      <p className="text-xs text-gray-500 font-bold">Hired</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleViewApplicants(posting)}
                      className="flex-1 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg transition-all duration-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Applicants ({getApplicantsForPosting(posting.id).length})
                    </Button>
                  </div>
                </motion.div>
              ))}

              {myPostings.filter(p => p.status === 'active' || p.status === 'filled').length === 0 && (
                <motion.div 
                  className="col-span-2 text-center py-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-xl text-gray-900 mb-2">No job postings yet</h3>
                  <p className="text-gray-500 mb-6">Get started by posting your first job opening</p>
                  <Button 
                    onClick={() => {
                      setJobRole('');
                      setIsPostJobModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-xl font-bold transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="applicants" className="space-y-4">
            {/* Recent Applicants List */}
            {recentApplicants
              .filter(applicant => !rejectedApplicantIds.includes(applicant.id))
              .map((applicant, idx) => {
                const isAccepted = acceptedApplicants[applicant.id] !== undefined;
                const initials = applicant.user_profiles.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase();
                
                return (
                  <motion.div 
                    key={applicant.id} 
                    className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border ${
                      isAccepted ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-violet-200'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-black text-xl text-gray-900 mb-1">{applicant.user_profiles.full_name}</h3>
                            <p className="text-sm text-gray-600 font-medium">{applicant.job_postings.title}</p>
                          </div>
                          {isAccepted && (
                            <Badge className="bg-green-500 text-white rounded-full">
                              ✓ Accepted
                            </Badge>
                          )}
                        </div>

                        {/* Bio/Cover Letter */}
                        {applicant.cover_letter && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{applicant.cover_letter}</p>
                        )}

                        {/* Actions */}
                        {!isAccepted && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewProfile(applicant)}
                              variant="outline"
                              className="flex-1 rounded-xl font-bold transition-all duration-300"
                            >
                              View Profile
                            </Button>
                            <Button
                              onClick={() => handleAcceptApplicant(applicant)}
                              className="flex-1 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleRejectApplicant(applicant)}
                              variant="outline"
                              className="rounded-xl font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {isAccepted && !hasReviewed(applicant) && (
                          <Button
                            onClick={() => handleReviewStaff(applicant)}
                            className="w-full rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Leave a Review
                          </Button>
                        )}
                        {isAccepted && hasReviewed(applicant) && (
                          <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                            <Star className="h-3 w-3 mr-1 fill-amber-700" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            {recentApplicants.filter(a => !rejectedApplicantIds.includes(a.id)).length === 0 && (
              <motion.div 
                className="text-center py-16 bg-white rounded-2xl shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-gray-900 mb-2">No applicants yet</h3>
                <p className="text-gray-500">Applicants will appear here once they apply to your job postings</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Post New Job Modal */}
      <Dialog open={isPostJobModalOpen} onOpenChange={setIsPostJobModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
                  Post a New Job
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Fill in the details to create a new job posting
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Event Servers Needed - Tech Conference"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobRole">Role/Position *</Label>
              <Input
                id="jobRole"
                placeholder="e.g., Server, Bartender, Event Coordinator"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Describe the job responsibilities, requirements, and any special instructions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="rounded-xl min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobStartDate">Event Start Date *</Label>
                <Input
                  id="jobStartDate"
                  type="date"
                  value={jobStartDate}
                  onChange={(e) => setJobStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobEndDate">Event End Date (Optional)</Label>
                <Input
                  id="jobEndDate"
                  type="date"
                  value={jobEndDate}
                  onChange={(e) => setJobEndDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobStartTime">Start Time</Label>
                <Input
                  id="jobStartTime"
                  type="time"
                  value={jobStartTime}
                  onChange={(e) => setJobStartTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobEndTime">End Time</Label>
                <Input
                  id="jobEndTime"
                  type="time"
                  value={jobEndTime}
                  onChange={(e) => setJobEndTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobLocation">Location *</Label>
              <Input
                id="jobLocation"
                placeholder="e.g., San Francisco, CA"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positionsNeeded">Positions Needed *</Label>
                <Input
                  id="positionsNeeded"
                  type="number"
                  placeholder="e.g., 5"
                  value={positionsNeeded}
                  onChange={(e) => setPositionsNeeded(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="e.g., 35"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPostJobModalOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostJob}
              className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              Post Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Applicants Modal */}
      <Dialog open={isApplicantsModalOpen} onOpenChange={setIsApplicantsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Applicants for {selectedPosting?.title}</DialogTitle>
            <DialogDescription>Review and manage applications for this job posting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {getApplicantsForPosting(selectedPosting?.id).length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No applicants yet for this position</p>
              </div>
            ) : (
              getApplicantsForPosting(selectedPosting?.id).map((applicant) => {
                const isAccepted = acceptedApplicants[applicant.id] !== undefined;
                const initials = applicant.user_profiles.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase();
                
                return (
                  <div 
                    key={applicant.id} 
                    className={`border rounded-2xl p-4 ${
                      isAccepted ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-black text-lg text-gray-900">{applicant.user_profiles.full_name}</h4>
                            <p className="text-sm text-gray-600">{applicant.user_profiles.email}</p>
                          </div>
                          {isAccepted && (
                            <Badge className="bg-green-500 text-white rounded-full">
                              ✓ Accepted
                            </Badge>
                          )}
                        </div>
                        {applicant.cover_letter && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{applicant.cover_letter}</p>
                        )}
                        {!isAccepted && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewProfile(applicant)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg font-bold"
                            >
                              View Profile
                            </Button>
                            <Button
                              onClick={() => handleAcceptApplicant(applicant)}
                              size="sm"
                              className="rounded-lg font-bold bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleRejectApplicant(applicant)}
                              variant="outline"
                              size="sm"
                              className="rounded-lg font-bold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Applicant Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {selectedApplicant && (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    {selectedApplicant.user_profiles.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-gray-900 mb-1">{selectedApplicant.user_profiles.full_name}</h3>
                    <p className="text-gray-600">{selectedApplicant.user_profiles.email}</p>
                    <p className="text-gray-600">{selectedApplicant.user_profiles.phone}</p>
                  </div>
                </div>

                {selectedApplicant.cover_letter && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Cover Letter</h4>
                    <p className="text-gray-600">{selectedApplicant.cover_letter}</p>
                  </div>
                )}

                {selectedApplicant.availability && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Availability</h4>
                    <p className="text-gray-600">{selectedApplicant.availability}</p>
                  </div>
                )}

                {selectedApplicant.additional_info && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Additional Information</h4>
                    <p className="text-gray-600">{selectedApplicant.additional_info}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign to Event Modal */}
      <Dialog open={isAssignEventModalOpen} onOpenChange={setIsAssignEventModalOpen}>
        <DialogContent className="rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Assign to Job Posting</DialogTitle>
            <DialogDescription>
              Select which job posting to assign {applicantToAssign?.user_profiles.full_name} to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {myPostings.filter(p => p.status === 'active').map((posting) => (
              <button
                key={posting.id}
                onClick={() => handleAssignToEvent(posting.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all"
              >
                <h4 className="font-bold text-gray-900">{posting.title}</h4>
                <p className="text-sm text-gray-600">{formatDate(posting.start_date)} • {posting.location}</p>
                <p className="text-sm text-gray-500 mt-1">{posting.hired || 0}/{posting.positions_needed} positions filled</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Staff Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Review Staff Member</DialogTitle>
            <DialogDescription>Provide feedback on the performance of {applicantToReview?.user_profiles.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {applicantToReview && (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    {applicantToReview.user_profiles.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl text-gray-900 mb-1">{applicantToReview.user_profiles.full_name}</h3>
                    <p className="text-gray-600">{applicantToReview.user_profiles.email}</p>
                    <p className="text-gray-600">{applicantToReview.user_profiles.phone}</p>
                  </div>
                </div>

                {applicantToReview.cover_letter && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Cover Letter</h4>
                    <p className="text-gray-600">{applicantToReview.cover_letter}</p>
                  </div>
                )}

                {applicantToReview.availability && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Availability</h4>
                    <p className="text-gray-600">{applicantToReview.availability}</p>
                  </div>
                )}

                {applicantToReview.additional_info && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Additional Information</h4>
                    <p className="text-gray-600">{applicantToReview.additional_info}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reviewRating">Rating</Label>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-gray-300" />
                    <Input
                      id="reviewRating"
                      type="number"
                      min="1"
                      max="5"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="rounded-xl w-16"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewComment">Comment</Label>
                  <Textarea
                    id="reviewComment"
                    placeholder="Provide any additional feedback or comments..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              className="rounded-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}