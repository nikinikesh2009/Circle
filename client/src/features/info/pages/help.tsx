import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  Mail, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageCircle,
  Send
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/shared/lib/queryClient';
import { useToast } from '@/shared/hooks/use-toast';

const faqItems = [
  {
    category: 'Getting Started',
    questions: [
      {
        id: 'q1',
        question: 'How do I get started with The Circle?',
        answer: 'Simply create an account with your email and password. Once logged in, you can explore the dashboard, set up your first habit, or create a daily plan.',
      },
      {
        id: 'q2',
        question: 'Is The Circle free to use?',
        answer: 'Yes, The Circle is currently free to use with all features available to all users. We may introduce premium features in the future.',
      },
      {
        id: 'q3',
        question: 'Can I use The Circle on my phone?',
        answer: 'Absolutely! The Circle is a Progressive Web App (PWA) that works on any device. You can install it on your phone for a native app experience.',
      },
    ],
  },
  {
    category: 'Habits & Tracking',
    questions: [
      {
        id: 'q7',
        question: 'How do streaks work?',
        answer: 'Complete your habits daily to build a streak. Your current streak increases with each consecutive day. Missing a day resets your current streak, but your best streak is saved.',
      },
      {
        id: 'q8',
        question: 'Can I edit or delete habits?',
        answer: 'Yes, you can edit habit details, change frequencies, or mark habits as inactive from the Habits page.',
      },
    ],
  },
  {
    category: 'Focus & Productivity',
    questions: [
      {
        id: 'q10',
        question: 'How does Focus Mode work?',
        answer: 'Focus Mode provides customizable timers for work sessions and breaks. Track distractions to improve concentration.',
      },
      {
        id: 'q11',
        question: 'Can I customize focus session durations?',
        answer: 'Yes, you can set custom work and break durations in your preferences, or use the default Pomodoro technique (25 min work, 5 min break).',
      },
    ],
  },
  {
    category: 'Community',
    questions: [
      {
        id: 'q12',
        question: 'How do I join groups?',
        answer: 'Browse available groups from the Groups page and click Join. You can participate in discussions, share progress, and connect with members.',
      },
      {
        id: 'q13',
        question: 'Can I message other users?',
        answer: 'Yes, use the Messages feature to send private messages to other users. Build accountability partnerships and support networks.',
      },
      {
        id: 'q14',
        question: 'How do I like posts?',
        answer: 'Click the heart icon on any motivational post or community update to show appreciation. Your likes help boost content visibility.',
      },
    ],
  },
  {
    category: 'Account & Settings',
    questions: [
      {
        id: 'q15',
        question: 'How do I update my profile?',
        answer: 'Go to Settings > Profile to update your bio, country, profile photo, and privacy preferences.',
      },
      {
        id: 'q16',
        question: 'Can I export my data?',
        answer: 'Data export functionality is coming soon. Contact support if you need immediate assistance with your data.',
      },
      {
        id: 'q17',
        question: 'How do I delete my account?',
        answer: 'Contact support at support@thecircle.com to request account deletion. We\'ll process your request within 48 hours.',
      },
    ],
  },
];

const supportFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type SupportFormData = z.infer<typeof supportFormSchema>;

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const submitTicket = useMutation({
    mutationFn: async (data: SupportFormData) => {
      return await apiRequest('POST', '/api/support/ticket', data);
    },
    onSuccess: () => {
      toast({
        title: 'Ticket Submitted',
        description: 'We\'ve received your support request and will respond within 24 hours.',
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit support ticket. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SupportFormData) => {
    submitTicket.mutate(data);
  };

  const filteredFAQ = faqItems.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/settings">
              <button 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="heading-help">Help & Support</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-faq"
              />
            </div>

            {filteredFAQ.map((category) => (
              <div key={category.category}>
                <h2 className="text-lg font-semibold mb-4" data-testid={`heading-category-${category.category}`}>
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.questions.map((item) => {
                    const isExpanded = expandedQuestion === item.id;
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-0">
                          <button
                            onClick={() => setExpandedQuestion(isExpanded ? null : item.id)}
                            className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-muted/50 transition-colors"
                            data-testid={`button-question-${item.id}`}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="font-medium" data-testid={`text-question-${item.id}`}>{item.question}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pl-12">
                              <p className="text-muted-foreground leading-relaxed" data-testid={`text-answer-${item.id}`}>
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" data-testid="heading-docs-intro">
                      Comprehensive Documentation
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid="text-docs-intro">
                      Access detailed guides, tutorials, and API documentation for all features of The Circle. 
                      Learn how to make the most of daily planner, habits, focus mode, and community features.
                    </p>
                    <Link href="/documentation">
                      <Button className="gap-2" data-testid="button-view-docs">
                        <BookOpen className="w-4 h-4" />
                        View Full Documentation
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2" data-testid="heading-quick-links">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Quick Start Guides
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li data-testid="text-guide-1">• Getting Started with The Circle</li>
                    <li data-testid="text-guide-2">• Creating Your First Daily Plan</li>
                    <li data-testid="text-guide-3">• Building Effective Habits</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2" data-testid="heading-advanced">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Advanced Features
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li data-testid="text-advanced-1">• Focus Mode & Distraction Tracking</li>
                    <li data-testid="text-advanced-2">• Community Groups & Messaging</li>
                    <li data-testid="text-advanced-3">• PWA Installation Guide</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" data-testid="heading-contact">Contact Support</h3>
                    <p className="text-muted-foreground" data-testid="text-contact">
                      Can't find an answer? Submit a support ticket and we'll get back to you within 24 hours.
                    </p>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your issue" {...field} data-testid="input-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your issue or question in detail..." 
                              className="min-h-[120px]" 
                              {...field} 
                              data-testid="input-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full gap-2" 
                      disabled={submitTicket.isPending}
                      data-testid="button-submit-ticket"
                    >
                      {submitTicket.isPending ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Support Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2" data-testid="heading-response-time">Response Time</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-response-time">
                  Our support team typically responds within 24 hours during business days. 
                  For urgent issues, please include "URGENT" in your subject line.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
