import { render, screen, fireEvent } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import { vi } from 'vitest';

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn();
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders registration form with all fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles form submission with all fields', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: testData.name } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: testData.email } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: testData.password } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: testData.confirmPassword } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(testData);
  });

  it('disables form elements when loading', () => {
    render(<RegisterForm isLoading={true} />);
    
    expect(screen.getByLabelText(/full name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('requires all fields to be filled', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);
    
    // Try submitting without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    // Verify required attributes
    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    expect(screen.getByLabelText(/email/i)).toBeRequired();
    expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    expect(screen.getByLabelText(/confirm password/i)).toBeRequired();
  });
}); 