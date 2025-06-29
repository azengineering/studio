
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scale, X, Ban, Mail } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

interface BlockInfo {
  reason: string;
  until: string | null;
}

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const redirectPath = searchParams.get('redirect');
      await login(values.email, values.password, redirectPath);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('BLOCKED::')) {
          const [_, reason, until] = error.message.split('::');
          setBlockInfo({ reason, until: until !== 'null' ? until : null });
      } else {
        toast({
          title: "Login Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    }
  }

  const BlockedDialog = () => {
    if (!blockInfo) return null;
    
    const blockedUntilDate = blockInfo.until ? new Date(blockInfo.until).toLocaleString() : 'Permanent';

    return (
      <AlertDialog open={!!blockInfo} onOpenChange={() => setBlockInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Ban className="text-destructive" /> Account Blocked</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-left py-4 space-y-2 text-sm text-muted-foreground">
                <p>Your account has been blocked by an administrator.</p>
                <p><strong>Reason:</strong> {blockInfo.reason}</p>
                <p><strong>Blocked Until:</strong> {blockedUntilDate}</p>
                <p>If you believe this is a mistake, please contact our support team.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setBlockInfo(null)}>Acknowledge</Button>
            <AlertDialogAction asChild>
                <a href="mailto:support@politirate.com" className="flex items-center gap-2">
                    <Mail /> Contact Support
                </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <>
    <BlockedDialog />
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center container mx-auto px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="w-full max-w-md shadow-2xl border-border/20 rounded-xl relative">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
          <CardHeader className="text-center p-8">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              <Scale className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">{t('loginPage.title')}</CardTitle>
            <CardDescription className="pt-1">{t('loginPage.description')}</CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginPage.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} className="py-6"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('loginPage.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="py-6"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full py-6 text-lg">
                  {t('loginPage.loginButton')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center p-8 bg-secondary/30 rounded-b-xl">
            <p className="text-sm text-muted-foreground">
              {t('loginPage.signupPrompt')} <Link href="/signup" className="text-primary hover:underline font-bold">{t('signupPage.signupLink')}</Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
    </>
  );
}
