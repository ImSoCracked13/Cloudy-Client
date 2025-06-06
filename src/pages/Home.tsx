import { A } from '@solidjs/router';

export default function Home() {
  return (
    <div class="min-h-screen bg-background">
      {/* Hero Section */}
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="flex flex-col md:flex-row items-center">
            <div class="md:w-1/2 mb-8 md:mb-0">
              <h1 class="text-4xl md:text-5xl font-bold mb-6">
                Secure Cloud Storage for Everyone
              </h1>
              <p class="text-xl mb-6">
                Store, share, and access your files from anywhere with our secure cloud storage solution.
              </p>
              <div class="flex gap-4">
                <A href="/register" class="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-medium">
                  Get Started
                </A>
                <A href="/about" class="bg-background-darker hover:bg-background-light text-text px-6 py-3 rounded-md font-medium">
                  Learn More
                </A>
              </div>
            </div>
            <div class="md:w-1/2">
              <img src="/cloudy.svg" alt="Cloud Storage" class="w-full max-w-md mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="py-16 px-4 bg-background-darker">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-8">Why Choose Cloudy?</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-background p-6 rounded-lg shadow-lg">
              <div class="text-primary mb-4">
                <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Secure Storage</h3>
              <p class="text-text-muted">
                Your files are encrypted and protected with the latest security measures.
              </p>
            </div>

            <div class="bg-background p-6 rounded-lg shadow-lg">
              <div class="text-primary mb-4">
                <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Access Anywhere</h3>
              <p class="text-text-muted">
                Access your files from any device, anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section class="py-20 px-4">
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p class="text-xl mb-8">
            Join thousands of users who trust Cloudy with their files.
          </p>
          <A href="/register" class="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-medium">
            Create Free Account
          </A>
        </div>
      </section>
    </div>
  );
} 