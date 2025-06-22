import { useNavigate } from '@solidjs/router';
import Button from '../components/widgets/Button';

export default function About() {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-background">
      {/* Hero Section */}
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-text text-center mb-6">
            About <span class="text-primary">Cloudy</span>
          </h1>
          <p class="text-xl text-text-muted text-center max-w-3xl mx-auto mb-10">
            Secure, reliable, and user-friendly cloud storage for individuals and businesses.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section class="py-12 px-4 bg-background-darker">
        <div class="max-w-6xl mx-auto">
          <div class="flex flex-col md:flex-row items-center gap-8">
            <div class="md:w-1/2">
              <h2 class="text-3xl font-bold text-text mb-6">Our Mission</h2>
              <p class="text-text-muted mb-4">
                Cloudy is designed to provide a secure, reliable, and user-friendly platform for storing and managing your files. Our mission is to simplify file management while ensuring the highest levels of security and performance.
              </p>
              <p class="text-text-muted">
                Whether you're storing important documents, sharing files with teammates, or organizing your personal media, Cloudy offers the tools you need with the reliability you expect.
              </p>
            </div>
            <div class="md:w-1/2 flex justify-center">
              <img 
                src="/cloudy.svg" 
                alt="Cloudy logo" 
                class="w-64 h-64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-text text-center mb-12">Our Core Values</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-background-darker p-6 rounded-lg">
              <div class="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-text mb-2">Security</h3>
              <p class="text-text-muted">
                We prioritize the security of your data above all else, employing end-to-end encryption and robust security measures to protect your files.
              </p>
            </div>
            
            <div class="bg-background-darker p-6 rounded-lg">
              <div class="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-text mb-2">Transparency</h3>
              <p class="text-text-muted">
                We believe in being open and honest with our users about how their data is stored, processed, and protected.
              </p>
            </div>
            
            <div class="bg-background-darker p-6 rounded-lg">
              <div class="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <svg class="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-text mb-2">User-Centric</h3>
              <p class="text-text-muted">
                We design our products with our users in mind, focusing on intuitive interfaces and features that make your life easier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section class="py-16 px-4 bg-background-darker">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-text text-center mb-12">Our Team</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-background p-6 rounded-lg text-center">
              <div class="w-24 h-24 rounded-full mx-auto mb-4 bg-primary/20 flex items-center justify-center">
                <span class="text-4xl font-bold text-primary">P</span>
              </div>
              <h3 class="text-xl font-semibold text-text">Pham</h3>
              <p class="text-primary mb-2">Database & Storage Engineer</p>
              <p class="text-text-muted">
                Expert in database architecture and storage solutions, ensuring your data is safely stored and efficiently managed.
              </p>
            </div>
            
            <div class="bg-background p-6 rounded-lg text-center">
              <div class="w-24 h-24 rounded-full mx-auto mb-4 bg-primary/20 flex items-center justify-center">
                <span class="text-4xl font-bold text-primary">H</span>
              </div>
              <h3 class="text-xl font-semibold text-text">Hong</h3>
              <p class="text-primary mb-2">Frontend Engineer</p>
              <p class="text-text-muted">
                Creates intuitive and responsive user interfaces that make interacting with Cloudy a seamless experience.
              </p>
            </div>
            
            <div class="bg-background p-6 rounded-lg text-center">
              <div class="w-24 h-24 rounded-full mx-auto mb-4 bg-primary/20 flex items-center justify-center">
                <span class="text-4xl font-bold text-primary">P</span>
              </div>
              <h3 class="text-xl font-semibold text-text">Phuc</h3>
              <p class="text-primary mb-2">Backend Engineer</p>
              <p class="text-text-muted">
                Develops robust server-side solutions that power Cloudy's features and ensure optimal performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-text text-center mb-12">Technologies</h2>
          <p class="text-text-muted text-center mb-10">
            Our platform leverages cutting-edge technologies to deliver a fast, reliable, and secure file management experience:
          </p>
          
          <div class="grid grid-cols-4 gap-8 mb-12">
            {/* 1 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/ElysiaJS.png" alt="ElysiaJS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Backend: ElysiaJS</h3>
              <p class="text-text-muted text-sm">
                TypeScript framework for building fast and reliable APIs
              </p>
            </div>
            {/* 2 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/SolidJS.png" alt="SolidJS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Frontend: SolidJS</h3>
              <p class="text-text-muted text-sm">
                Reactive UI framework for building fast, efficient web applications
              </p>
            </div>
            {/* 3 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/BunJS.png" alt="BunJS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Runtime: BunJS</h3>
              <p class="text-text-muted text-sm">
                Fast JavaScript package manager and toolkit for modern development
              </p>
            </div>
            {/* 4 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/UnoCSS.png" alt="UnoCSS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Styling: UnoCSS</h3>
              <p class="text-text-muted text-sm">
                Instant atomic CSS engine for modern web development
              </p>
            </div>
            {/* 5 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/PostgreSQL.png" alt="PostgreSQL" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Database: PostgreSQL</h3>
              <p class="text-text-muted text-sm">
                Powerful, open source object-relational database system
              </p>
            </div>
            {/* 6 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Redis.png" alt="Redis" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Cache: Redis</h3>
              <p class="text-text-muted text-sm">
                In-memory data store for caching and session management
              </p>
            </div>
            {/* 7 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/MinIO.png" alt="MinIO" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Storage: MinIO</h3>
              <p class="text-text-muted text-sm">
                High-performance, S3-compatible object storage
              </p>
            </div>
            {/* 8 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/AWS.png" alt="AWS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Storage Hosting: AWS</h3>
              <p class="text-text-muted text-sm">
                Reliable and scalable cloud infrastructure for storage and compute
              </p>
            </div>
            {/* 9 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Upstash.png" alt="Upstash" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Cache Hosting: Upstash</h3>
              <p class="text-text-muted text-sm">
                Global, serverless Redis for caching and rate limiting
              </p>
            </div>
            {/* 10 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Supabase.png" alt="Supabase" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Database Hosting: Supabase</h3>
              <p class="text-text-muted text-sm">
                Managed PostgreSQL with real-time and authentication features
              </p>
            </div>
            {/* 11 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Cloudlflare Pages.png" alt="Cloudflare Pages" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Frontend Hosting: Cloudflare Pages</h3>
              <p class="text-text-muted text-sm">
                Edge-deployed static site hosting for ultra-fast delivery
              </p>
            </div>
            {/* 12 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Fly.io.png" alt="Fly.io" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Backend Hosting: Fly.io</h3>
              <p class="text-text-muted text-sm">
                Global app hosting platform for fast, scalable deployments
              </p>
            </div>
            {/* 13 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Docker.png" alt="Docker" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Containerization: Docker</h3>
              <p class="text-text-muted text-sm">
                Standard for containerizing and deploying applications
              </p>
            </div>
            {/* 14 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Vite.png" alt="Vite" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Development: Vite</h3>
              <p class="text-text-muted text-sm">
                Local server for project template and efficient for bundling
              </p>
            </div>
            {/* 15 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/Drizzle.png" alt="Drizzle ORM" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">ORM: Drizzle</h3>
              <p class="text-text-muted text-sm">
                Type-safe ORM for PostgreSQL and modern TypeScript projects
              </p>
            </div>
            {/* 16 */}
            <div class="bg-background-darker p-6 rounded-lg text-center flex flex-col items-center">
              <img src="/EmailJS.png" alt="EmailJS" class="h-16 mb-4" />
              <h3 class="text-lg font-semibold text-text">Email Service: EmailJS</h3>
              <p class="text-text-muted text-sm">
                Open-source mailing resources for token verifications and auto responses
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="py-16 px-4">
        <div class="max-w-6xl mx-auto text-center">
          <h2 class="text-3xl font-bold text-text mb-6">
            Ready to experience Cloudy?
          </h2>
          <p class="text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Join thousands of users who trust us with their important files.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigate('/register')}>
              Create Free Account
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 