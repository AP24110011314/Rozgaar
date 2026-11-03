import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './api/axios.js';
import App from './App.jsx';

describe('App & Authentication Routing', () => {
  beforeEach(() => {
    // Mock silent refresh on axios to reject gracefully (guest state)
    vi.spyOn(api, 'post').mockImplementation((url) => {
      if (url === '/auth/refresh') {
        const error = new Error('Unauthorized');
        error.response = { status: 401, data: { error: { code: 'UNAUTHENTICATED' } } };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { data: {} } });
    });
  });

  it('renders Rozgaar brand in the Navbar and Home Page', async () => {
    await act(async () => {
      render(<App />);
    });

    const brandElements = screen.getAllByText(/Rozgaar/i);
    expect(brandElements.length).toBeGreaterThanOrEqual(1);

    const hindiElements = screen.getAllByText(/रोज़गार/i);
    expect(hindiElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/Local hiring that solves/i)).toBeInTheDocument();
  });

  it('renders Log in and Sign up buttons when unauthenticated', async () => {
    await act(async () => {
      render(<App />);
    });

    const loginButtons = screen.getAllByText(/Log in/i);
    expect(loginButtons.length).toBeGreaterThanOrEqual(1);

    const signupButtons = screen.getAllByText(/Sign up/i);
    expect(signupButtons.length).toBeGreaterThanOrEqual(1);
  });
});
