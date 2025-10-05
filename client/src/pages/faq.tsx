import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    {
      question: "What is The Circle?",
      answer: "The Circle is a comprehensive productivity platform that combines AI-powered planning, habit tracking, focus mode, and community features to help you achieve your goals."
    },
    {
      question: "How do I get started?",
      answer: "Simply create an account, complete your profile, and start using the AI-powered daily planner to organize your day. You can also track habits, join focus sessions, and connect with the community."
    },
    {
      question: "Is The Circle free to use?",
      answer: "Yes, The Circle is free to use with all core features available to all users."
    },
    {
      question: "How does the AI planner work?",
      answer: "The AI planner analyzes your goals and tasks to create an optimized daily schedule. You can describe your day, and the AI will generate a structured plan with time blocks and priorities."
    },
    {
      question: "What are habits and how do they work?",
      answer: "Habits are recurring activities you want to build into your routine. Track your daily progress, build streaks, and receive AI-powered nudges to stay motivated."
    },
    {
      question: "Can I use The Circle offline?",
      answer: "The Circle is a Progressive Web App (PWA) with offline capabilities. You can install it on your device and access certain features without an internet connection."
    },
    {
      question: "How do I track my streak?",
      answer: "Your streak automatically updates when you complete tasks or check in daily. Visit your profile to see your current streak and best streak."
    },
    {
      question: "What is Focus Mode?",
      answer: "Focus Mode helps you concentrate on important tasks by providing timed work sessions with breaks. It blocks distractions and keeps you on track."
    },
    {
      question: "How does the AI Chat work?",
      answer: "The AI Chat is your personal assistant that can help with planning, motivation, problem-solving, and more. It supports text, images, audio, and documents."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted and stored securely. We never share your personal information with third parties."
    },
    {
      question: "How do I delete my account?",
      answer: "You can delete your account from the Settings page. This will permanently remove all your data from our servers."
    },
    {
      question: "Can I export my data?",
      answer: "Currently, data export is not available, but we're working on adding this feature in a future update."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/settings">
          <button 
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="heading-faq">Frequently Asked Questions</h1>
              <p className="text-muted-foreground mt-1" data-testid="text-faq-subtitle">Find answers to common questions</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline" data-testid={`faq-question-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2" data-testid="heading-still-questions">Still have questions?</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-contact-info">
              Can't find the answer you're looking for? Use the AI Chat to ask your questions or reach out through the community.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
