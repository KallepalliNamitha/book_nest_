import React from 'react';
import { Container } from 'react-bootstrap';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Container className="py-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">Welcome to BookStore</h1>
          <p className="text-2xl text-gray-600 mb-8">Your one-stop destination for all your reading needs</p>
          
          <div className="mt-12">
            <img 
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
              alt="Books Library"
              className="rounded-lg shadow-2xl mx-auto max-w-4xl w-full"
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Home; 