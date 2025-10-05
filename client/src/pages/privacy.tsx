import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacy() {
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Privacy Policy</h1>
              <p className="text-muted-foreground mt-1">How we protect your data</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Last Updated:</strong> October 2025
              </p>
              <p className="text-muted-foreground leading-relaxed">
                At The Circle, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, and protect your personal information when you use our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Account Information</h3>
                  <p className="text-sm">
                    When you create an account, we collect your email address and encrypted password. 
                    This information is used solely for authentication and account management.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Usage Data</h3>
                  <p className="text-sm">
                    We collect information about how you use The Circle, including your tasks, habits, 
                    schedules, and interactions with AI features. This data helps us improve our services.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Content</h3>
                  <p className="text-sm">
                    Any content you create (tasks, notes, posts, messages) is stored securely and 
                    associated with your account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>To provide and improve our services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>To personalize your experience with AI-powered features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>To communicate with you about updates and features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>To maintain security and prevent fraud</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>To analyze usage patterns and improve our platform</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>All data is encrypted in transit and at rest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Passwords are hashed using secure algorithms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Regular security audits and updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Limited access to personal data by authorized personnel only</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                The Circle uses the following third-party services:
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Authentication:</strong> We use secure authentication services to manage user accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>AI Services:</strong> Your AI interactions are processed by Google Gemini with privacy protections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Cloud Storage:</strong> Files are stored securely in encrypted cloud storage</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed text-sm mb-3">
                You have the following rights regarding your data:
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Access:</strong> You can access all your data through your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Deletion:</strong> You can delete your account and all associated data at any time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Correction:</strong> You can update or correct your information through Settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Portability:</strong> Data export features are coming soon</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We retain your personal data only as long as necessary to provide our services and comply 
                with legal obligations. When you delete your account, we permanently remove all your data 
                from our servers within 30 days.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                The Circle is not intended for use by children under 13 years of age. We do not knowingly 
                collect personal information from children under 13.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any significant 
                changes by posting a notice on our platform or sending you an email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                If you have any questions about this Privacy Policy or our data practices, please use the 
                AI Chat feature or reach out through the community.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
