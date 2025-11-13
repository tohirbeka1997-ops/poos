import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';
import { signIn, signUp } from '@/services/authService';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please enter username and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        // Sign up new user
        await signUp(username, password, username);
        
        toast({
          title: 'Success!',
          description: 'Account created successfully. You can now sign in.',
        });

        // Auto sign in after registration
        const profile = await signIn(username, password);
        
        if (profile) {
          toast({
            title: 'Welcome!',
            description: 'Successfully signed in.',
          });
          navigate('/');
        }
      } else {
        // Sign in existing user
        const profile = await signIn(username, password);
        
        if (profile) {
          toast({
            title: 'Welcome!',
            description: 'Successfully signed in.',
          });
          navigate('/');
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'Error',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRegister ? 'Sign Up' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? 'Create a new account'
              : 'Sign in to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? 'Loading...'
                : isRegister
                  ? 'Sign Up'
                  : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary hover:underline"
              disabled={isLoading}
            >
              {isRegister
                ? 'Already have an account? Sign In'
                : 'Don\'t have an account? Sign Up'}
            </button>
          </div>
          {isRegister && (
            <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <p className="font-medium mb-1">Note:</p>
              <p>The first registered user will automatically become an administrator.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
