import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { MapPin, Calendar, DollarSign, Users, Briefcase, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  hourly_rate: number;
  positions_needed: number;
  role: string;
  status: string;
  created_at: string;
  organizer_id: string;
  user_profiles: {
    full_name: string;
    company: string;
  };
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string;
  availability: string;
  status: string;
  created_at: string;
  job_postings: {
    id: string;
    title: string;
    location: string;
    start_date: string;
    hourly_rate: number;
  };
}

export function StaffDashboard({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [availability, setAvailability] = useState('');
  const [applying, setApplying] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const [activeTab, setActiveTab] = useState('browse');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view jobs');
        return;
      }

      // Get user profile to get location
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('location')
        .eq('id', user.id)
        .single();

      if (profile?.location) {
        setUserLocation(profile.location);
      }

      // Fetch all active job postings
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        toast.error('Failed to load jobs');
      } else {
        // Fetch organizer profiles for all jobs
        if (jobsData && jobsData.length > 0) {
          const organizerIds = [...new Set(jobsData.map(job => job.organizer_id))];
          
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('id, full_name, company')
            .in('id', organizerIds);

          // Map profiles to jobs
          const jobsWithProfiles = jobsData.map(job => ({
            ...job,
            user_profiles: profilesData?.find(p => p.id === job.organizer_id) || {
              full_name: 'Unknown',
              company: 'Event Organizer'
            }
          }));

          setJobs(jobsWithProfiles);
        } else {
          setJobs([]);
        }
      }

      // Fetch user's applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          job_postings(id, title, location, start_date, hourly_rate)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
      } else {
        setMyApplications(applicationsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job: JobPosting) => {
    // Check if already applied
    const alreadyApplied = myApplications.some(app => app.job_id === job.id);
    if (alreadyApplied) {
      toast.error('You have already applied to this job');
      return;
    }

    setSelectedJob(job);
    setCoverLetter('');
    setAvailability('');
    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!selectedJob) return;

    if (!coverLetter.trim() || !availability.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setApplying(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to apply');
        return;
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: selectedJob.id,
          applicant_id: user.id,
          cover_letter: coverLetter,
          availability: availability,
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting application:', error);
        toast.error('Failed to submit application');
      } else {
        toast.success('Application submitted successfully!');
        setShowApplicationModal(false);
        setCoverLetter('');
        setAvailability('');
        setSelectedJob(null);
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getApplicationStatus = (jobId: string) => {
    return myApplications.find(app => app.job_id === jobId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isNearby = (jobLocation: string) => {
    if (!userLocation || !jobLocation) return false;
    return jobLocation.toLowerCase().includes(userLocation.toLowerCase()) ||
           userLocation.toLowerCase().includes(jobLocation.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Find Your Next Gig
          </h1>
          <p className="text-gray-600">
            Browse available positions and manage your applications
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
            <TabsTrigger 
              value="browse" 
              className="rounded-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Browse Jobs
            </TabsTrigger>
            <TabsTrigger 
              value="applications" 
              className="rounded-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              My Applications ({myApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Browse Jobs Tab */}
          <TabsContent value="browse" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 text-center shadow-lg"
              >
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search' : 'Check back soon for new opportunities'}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredJobs.map((job, index) => {
                    const application = getApplicationStatus(job.id);
                    const nearby = isNearby(job.location);
                    
                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        layout
                      >
                        <Card className="h-full hover:shadow-xl transition-shadow border-0 shadow-lg rounded-2xl overflow-hidden">
                          <CardHeader className="bg-gradient-to-br from-violet-50 to-fuchsia-50 pb-4">
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-xl font-black text-gray-900 line-clamp-2">
                                {job.title}
                              </CardTitle>
                              {nearby && (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 ml-2 whitespace-nowrap">
                                  Nearby
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm font-bold text-violet-600">
                              {job.user_profiles?.company || 'Event Organizer'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span className="line-clamp-1">{job.location}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span>{formatDate(job.start_date)}</span>
                              </div>
                              {job.start_time && job.end_time && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                  <span>{job.start_time} - {job.end_time}</span>
                                </div>
                              )}
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span className="font-bold">${job.hourly_rate}/hour</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span>{job.positions_needed} position{job.positions_needed > 1 ? 's' : ''} needed</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Briefcase className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                                <span className="line-clamp-1">{job.role}</span>
                              </div>
                            </div>

                            {job.description && (
                              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                {job.description}
                              </p>
                            )}

                            {application ? (
                              <div className="flex items-center justify-between">
                                <Badge 
                                  className={`${
                                    application.status === 'accepted' 
                                      ? 'bg-green-100 text-green-700 border-green-200' 
                                      : application.status === 'rejected'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  } border`}
                                >
                                  {application.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {application.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                  {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleApply(job)}
                                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                              >
                                Apply Now
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* My Applications Tab */}
          <TabsContent value="applications" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : myApplications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 text-center shadow-lg"
              >
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-500 mb-6">Start browsing jobs and apply to get started!</p>
                <Button
                  onClick={() => setActiveTab('browse')}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg"
                >
                  Browse Jobs
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {myApplications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                    >
                      <Card className="h-full hover:shadow-xl transition-shadow border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-br from-violet-50 to-fuchsia-50 pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-xl font-black text-gray-900 line-clamp-2">
                              {application.job_postings.title}
                            </CardTitle>
                            <Badge 
                              className={`${
                                application.status === 'accepted' 
                                  ? 'bg-green-500 text-white border-0' 
                                  : application.status === 'rejected'
                                  ? 'bg-red-500 text-white border-0'
                                  : 'bg-yellow-500 text-white border-0'
                              } ml-2 whitespace-nowrap`}
                            >
                              {application.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {application.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm font-bold text-gray-600">
                            Applied {formatDate(application.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                              <span className="line-clamp-1">{application.job_postings.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                              <span>{formatDate(application.job_postings.start_date)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-2 text-violet-600 flex-shrink-0" />
                              <span className="font-bold">${application.job_postings.hourly_rate}/hour</span>
                            </div>
                          </div>

                          {application.cover_letter && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs font-bold text-gray-500 mb-2">Your Cover Letter:</p>
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {application.cover_letter}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-2xl rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Apply to {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Submit your application to work with {selectedJob?.user_profiles?.company}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Job Details Summary */}
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-violet-600" />
                  <span className="text-gray-700">{selectedJob?.location}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-violet-600" />
                  <span className="text-gray-700 font-bold">${selectedJob?.hourly_rate}/hour</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-violet-600" />
                  <span className="text-gray-700">{selectedJob && formatDate(selectedJob.start_date)}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-violet-600" />
                  <span className="text-gray-700">{selectedJob?.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverLetter" className="font-bold text-gray-700">
                  Cover Letter / Why are you a good fit? *
                </Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell the organizer why you're the perfect fit for this role..."
                  className="min-h-[150px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability" className="font-bold text-gray-700">
                  Your Availability *
                </Label>
                <Textarea
                  id="availability"
                  placeholder="Let them know your availability (dates, times, any constraints)..."
                  className="min-h-[100px] rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-500"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
                className="rounded-xl font-bold"
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                onClick={submitApplication}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold rounded-xl shadow-lg"
                disabled={applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}