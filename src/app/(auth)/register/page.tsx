import { signup } from '@/app/(auth)/login/actions';

export default function RegisterPage() {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />

      <button formAction={signup}>Sign Up</button>
    </form>
  );
}