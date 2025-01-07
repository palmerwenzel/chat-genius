import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../LoginForm';
import { vi } from 'vitest';

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOAuthClick = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnOAuthClick.mockClear();
  });

  it('renders login form with all fields and buttons', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('handles form submission with email and password', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('handles OAuth button clicks', () => {
    render(<LoginForm onOAuthClick={mockOnOAuthClick} />);
    
    const githubButton = screen.getByRole('button', { name: /github/i });
    const googleButton = screen.getByRole('button', { name: /google/i });

    fireEvent.click(githubButton);
    expect(mockOnOAuthClick).toHaveBeenCalledWith('github');

    fireEvent.click(googleButton);
    expect(mockOnOAuthClick).toHaveBeenCalledWith('google');
  });

  it('disables form elements when loading', () => {
    render(<LoginForm isLoading={true} />);
    
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /github/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled();
  });
}); 