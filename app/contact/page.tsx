import Link from 'next/link'
import { Mail, MessageCircle, Github, Linkedin, MapPin, Clock, Send } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with me for project collaborations, job opportunities, or just to say hello.',
}

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Drop me a line anytime',
    value: 'your.email@example.com',
    href: 'mailto:your.email@example.com',
    primary: true,
  },
  {
    icon: Github,
    title: 'GitHub',
    description: 'Check out my code',
    value: '@yourusername',
    href: 'https://github.com/yourusername',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn',
    description: 'Let\'s connect professionally',
    value: '/in/yourusername',
    href: 'https://linkedin.com/in/yourusername',
  },
  {
    icon: MessageCircle,
    title: 'Discord',
    description: 'Chat with me',
    value: 'yourusername#1234',
    href: 'https://discord.com/users/yourusername',
  },
]

const faqs = [
  {
    question: 'What type of projects do you work on?',
    answer: 'I specialize in full-stack web applications, 3D web experiences, and interactive user interfaces. I love projects that combine modern web technologies with creative design and 3D graphics.',
  },
  {
    question: 'Are you available for freelance work?',
    answer: 'Yes! I\'m always interested in exciting freelance opportunities. Whether it\'s a short-term project or long-term collaboration, I\'d love to hear about your needs.',
  },
  {
    question: 'What\'s your typical response time?',
    answer: 'I usually respond to emails within 24-48 hours. For urgent matters, feel free to mention it in the subject line.',
  },
  {
    question: 'Do you offer consultation services?',
    answer: 'Absolutely! I provide technical consultation for web development projects, 3D integration, and technology stack decisions. Reach out to discuss your specific needs.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Let's Work Together
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              I'm always excited to hear about new projects and opportunities. 
              Whether you have a specific project in mind or just want to chat about technology, 
              I'd love to connect with you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:your.email@example.com"
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                <Mail className="h-5 w-5" />
                Send me an email
              </a>
              <Link
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                View Resume
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Choose your preferred way to reach out
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              return (
                <a
                  key={index}
                  href={method.href}
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`block p-6 rounded-lg border-2 transition-all duration-300 hover:shadow-lg group ${
                    method.primary
                      ? 'border-blue-200 bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:border-blue-700'
                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    method.primary
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-gray-600'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {method.description}
                  </p>
                  
                  <p className={`text-sm font-medium ${
                    method.primary
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {method.value}
                  </p>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Send a Message
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Fill out the form below and I'll get back to you as soon as possible
            </p>
          </div>

          {/* Netlify Forms compatible form */}
          <form
            name="contact"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm"
          >
            {/* Hidden fields for Netlify */}
            <input type="hidden" name="form-name" value="contact" />
            <input type="hidden" name="bot-field" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's this about?"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                placeholder="Tell me about your project or what you'd like to discuss..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Budget (Optional)
              </label>
              <select
                id="budget"
                name="budget"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a range</option>
                <option value="under-5k">Under $5,000</option>
                <option value="5k-15k">$5,000 - $15,000</option>
                <option value="15k-30k">$15,000 - $30,000</option>
                <option value="30k-plus">$30,000+</option>
                <option value="consulting">Consulting/Hourly</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4 flex-1"
              >
                <Send className="h-5 w-5" />
                Send Message
              </button>
              
              <a
                href="mailto:your.email@example.com"
                className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                <Mail className="h-5 w-5" />
                Direct Email
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4 text-center">
              Your information is secure and will never be shared with third parties.
            </p>
          </form>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Availability */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Availability & Response Times
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Response Time</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      I typically respond to emails within 24-48 hours during business days.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Location</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Based in San Francisco, CA (PST). Available for remote work worldwide.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Availability</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Currently accepting new projects and collaborations for Q1 2024.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <summary className="font-medium text-gray-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                      {faq.question}
                      <span className="ml-2 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
