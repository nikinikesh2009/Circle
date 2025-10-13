import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

// todo: remove mock functionality
const faqs = [
  {
    question: "How do I create a new circle?",
    answer: "To create a new circle, go to the Discover page and click the 'Create Circle' button. Fill in the details including name, description, category, and privacy settings. Once created, you can invite members to join.",
  },
  {
    question: "How do I enable push notifications?",
    answer: "Navigate to Settings > Notifications and toggle on 'Push Notifications'. Your browser will prompt you to allow notifications. Make sure to grant permission to receive real-time updates from your circles.",
  },
  {
    question: "Can I use the AI assistant for free?",
    answer: "Yes! The AI assistant is available to all Circle users. You can access it from any circle chat or by clicking the AI assistant button in the bottom right corner.",
  },
  {
    question: "How do private circles work?",
    answer: "Private circles are invite-only communities. They won't appear in search results or the Discover page. Only members can see the content and participate in discussions.",
  },
  {
    question: "How do I report inappropriate content?",
    answer: "Click the three dots menu on any message or post, then select 'Report'. Our moderation team reviews all reports within 24 hours.",
  },
];

export default function Support() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to common questions and get help with Circle
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            className="pl-10 h-12"
            data-testid="input-search-help"
          />
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger data-testid={`faq-question-${index}`}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent data-testid={`faq-answer-${index}`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you with any questions or issues.
          </p>
          <button
            className="text-primary hover:underline font-medium"
            onClick={() => console.log("Contact support clicked")}
            data-testid="button-contact-support"
          >
            Contact Support →
          </button>
        </Card>
      </div>
    </div>
  );
}
